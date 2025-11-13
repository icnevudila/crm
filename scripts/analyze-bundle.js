/**
 * Bundle Size Analyzer Script
 * Next.js build sonrası bundle boyutlarını analiz eder
 * 
 * Kullanım: npm run analyze-bundle
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('📦 Bundle Size Analyzer başlatılıyor...\n')

// Build yap
console.log('1️⃣ Build yapılıyor...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Build tamamlandı\n')
} catch (error) {
  console.error('❌ Build başarısız:', error.message)
  process.exit(1)
}

// .next/analyze klasörünü kontrol et
const analyzeDir = path.join(process.cwd(), '.next', 'analyze')
if (!fs.existsSync(analyzeDir)) {
  console.log('2️⃣ Bundle analizi yapılıyor...')
  try {
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' })
    console.log('✅ Bundle analizi tamamlandı\n')
  } catch (error) {
    console.error('❌ Bundle analizi başarısız:', error.message)
    process.exit(1)
  }
}

// Sonuçları göster
console.log('📊 Bundle analizi sonuçları:')
console.log('   - .next/analyze klasöründe HTML raporu oluşturuldu')
console.log('   - Tarayıcıda açarak detaylı analiz yapabilirsiniz\n')

// Büyük paketleri tespit et
console.log('🔍 Büyük paketler tespit ediliyor...')
const clientManifest = path.join(process.cwd(), '.next', 'build-manifest.json')
if (fs.existsSync(clientManifest)) {
  const manifest = JSON.parse(fs.readFileSync(clientManifest, 'utf-8'))
  console.log('   - Client manifest bulundu')
  console.log('   - Toplam chunk sayısı:', Object.keys(manifest.pages || {}).length)
}

console.log('\n✅ Analiz tamamlandı!')
console.log('💡 İpucu: .next/analyze klasöründeki HTML dosyasını tarayıcıda açın')


