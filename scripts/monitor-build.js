/**
 * Vercel Build Monitor Script
 * Build'i izler ve belirli süre geçerse otomatik iptal eder
 * 
 * Kullanım: node scripts/monitor-build.js [timeout-dakika]
 * Örnek: node scripts/monitor-build.js 15 (15 dakika timeout)
 */

const https = require('https')
const { execSync } = require('child_process')

// Timeout (dakika) - varsayılan 15 dakika
const TIMEOUT_MINUTES = parseInt(process.argv[2]) || 15
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000

console.log(`🔍 Build monitor başlatıldı - Timeout: ${TIMEOUT_MINUTES} dakika`)

// Vercel proje bilgilerini al
function getVercelProjectInfo() {
  try {
    const output = execSync('vercel ls --json', { encoding: 'utf-8' })
    const projects = JSON.parse(output)
    
    // En son projeyi bul (crm projesi)
    const project = projects.find(p => p.name.includes('crm') || p.name.includes('CRM'))
    if (!project) {
      throw new Error('Proje bulunamadı')
    }
    
    return {
      projectId: project.id,
      projectName: project.name,
    }
  } catch (error) {
    console.error('❌ Vercel proje bilgisi alınamadı:', error.message)
    console.log('💡 Vercel CLI ile giriş yaptığınızdan emin olun: vercel login')
    process.exit(1)
  }
}

// En son deployment'ı al
function getLatestDeployment(projectId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/deployments?projectId=${projectId}&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN || ''}`,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.deployments && result.deployments.length > 0) {
            resolve(result.deployments[0])
          } else {
            reject(new Error('Deployment bulunamadı'))
          }
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

// Deployment durumunu kontrol et
function checkDeploymentStatus(deploymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/deployments/${deploymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN || ''}`,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

// Deployment'ı iptal et
function cancelDeployment(deploymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v13/deployments/${deploymentId}/cancel`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

// Ana monitor fonksiyonu
async function monitorBuild() {
  try {
    // Proje bilgilerini al
    const { projectId, projectName } = getVercelProjectInfo()
    console.log(`📦 Proje: ${projectName} (${projectId})`)
    
    // En son deployment'ı bul
    console.log('🔍 En son deployment aranıyor...')
    const deployment = await getLatestDeployment(projectId)
    const deploymentId = deployment.uid
    
    console.log(`📋 Deployment ID: ${deploymentId}`)
    console.log(`📊 Durum: ${deployment.state || 'Bilinmiyor'}`)
    console.log(`⏱️  Timeout: ${TIMEOUT_MINUTES} dakika`)
    console.log('')
    
    // Başlangıç zamanı
    const startTime = Date.now()
    let lastState = deployment.state
    
    // Her 30 saniyede bir kontrol et
    const checkInterval = setInterval(async () => {
      try {
        const currentDeployment = await checkDeploymentStatus(deploymentId)
        const currentState = currentDeployment.state || 'UNKNOWN'
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000)
        
        // Durum değiştiyse logla
        if (currentState !== lastState) {
          console.log(`📊 Durum değişti: ${lastState} → ${currentState}`)
          lastState = currentState
        }
        
        // Build tamamlandı mı?
        if (currentState === 'READY' || currentState === 'ERROR' || currentState === 'CANCELED') {
          clearInterval(checkInterval)
          if (currentState === 'READY') {
            console.log('✅ Build başarıyla tamamlandı!')
          } else if (currentState === 'ERROR') {
            console.log('❌ Build hata ile sonuçlandı')
          } else {
            console.log('⚠️  Build iptal edildi')
          }
          process.exit(0)
        }
        
        // Timeout kontrolü
        if (Date.now() - startTime > TIMEOUT_MS) {
          clearInterval(checkInterval)
          console.log(`⏰ Timeout! (${TIMEOUT_MINUTES} dakika geçti)`)
          console.log('🛑 Build iptal ediliyor...')
          
          try {
            await cancelDeployment(deploymentId)
            console.log('✅ Build başarıyla iptal edildi')
          } catch (error) {
            console.error('❌ Build iptal edilemedi:', error.message)
            console.log('💡 Vercel Dashboard\'dan manuel olarak iptal edebilirsiniz')
          }
          
          process.exit(1)
        }
        
        // İlerleme logu (her 2 dakikada bir)
        if (elapsedMinutes % 2 === 0 && elapsedMinutes > 0) {
          console.log(`⏳ ${elapsedMinutes} dakika geçti... (${TIMEOUT_MINUTES - elapsedMinutes} dakika kaldı)`)
        }
      } catch (error) {
        console.error('❌ Durum kontrolü hatası:', error.message)
      }
    }, 30000) // 30 saniye
    
    // İlk kontrol
    console.log('🔄 Build izleniyor... (30 saniyede bir kontrol)')
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

// VERCEL_TOKEN kontrolü
if (!process.env.VERCEL_TOKEN) {
  console.log('⚠️  VERCEL_TOKEN environment variable bulunamadı')
  console.log('💡 Vercel token almak için:')
  console.log('   1. https://vercel.com/account/tokens adresine gidin')
  console.log('   2. Yeni token oluşturun')
  console.log('   3. export VERCEL_TOKEN=your-token (Linux/Mac)')
  console.log('   4. set VERCEL_TOKEN=your-token (Windows)')
  console.log('')
  console.log('💡 Veya Vercel CLI ile giriş yapın: vercel login')
  console.log('')
}

// Script'i çalıştır
monitorBuild()

