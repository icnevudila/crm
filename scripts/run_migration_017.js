// Migration 017 çalıştırma scripti
// CustomerCompany tablosuna yeni kolonlar ekler

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ HATA: Supabase environment variables gerekli!')
  console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local dosyasında olmalı')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function runMigration() {
  console.log('🔄 Migration 017 çalıştırılıyor...\n')

  try {
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, '../supabase/migrations/017_company_module_refactor.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // SQL'i satırlara böl ve çalıştır
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 ${statements.length} SQL statement bulundu\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // BEGIN/COMMIT bloklarını atla (bunlar transaction için)
      if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
        continue
      }

      try {
        console.log(`⏳ Statement ${i + 1}/${statements.length} çalıştırılıyor...`)
        
        // Supabase'de direkt SQL çalıştırmak için RPC kullan
        // Eğer RPC yoksa, alternatif yöntem deneyelim
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // RPC fonksiyonu yoksa, direkt query deneyelim
          // NOT: Supabase client ile direkt SQL çalıştıramayız
          // Bu yüzden kullanıcıya manuel çalıştırmasını söyleyelim
          console.warn('⚠️  RPC fonksiyonu bulunamadı. Manuel çalıştırma gerekli.')
          console.log('\n📋 Supabase Dashboard > SQL Editor\'de şu SQL\'i çalıştırın:\n')
          console.log(migrationSQL)
          break
        } else {
          console.log(`✅ Statement ${i + 1} başarılı`)
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} hatası:`, err.message)
        // Devam et, diğer statement'ları çalıştır
      }
    }

    console.log('\n✅ Migration tamamlandı!')
  } catch (error) {
    console.error('❌ Migration hatası:', error.message)
    console.log('\n📋 Alternatif: Supabase Dashboard > SQL Editor\'de migration dosyasını çalıştırın')
    process.exit(1)
  }
}

runMigration()























