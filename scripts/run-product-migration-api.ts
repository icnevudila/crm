/**
 * Product System Enhancement Migration Script (Supabase REST API ile)
 * InvoiceItem, StockMovement tabloları ve Product tablosuna yeni kolonlar ekler
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ HATA: Supabase environment variables gerekli!')
  console.error('Lütfen .env.local dosyanızda şunları tanımlayın:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log('🚀 Product System Enhancement Migration başlatılıyor...\n')

    // Migration SQL dosyasını oku
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/005_enhance_product_system.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration dosyası bulunamadı: ${migrationPath}`)
      process.exit(1)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL dosyası okundu\n')
    console.log('🔌 Supabase REST API\'ye bağlanılıyor...\n')

    // Supabase REST API'sine SQL çalıştırma isteği gönder
    // NOT: Supabase REST API'si direkt SQL çalıştırmayı desteklemiyor
    // Bu yüzden Supabase Management API kullanmamız gerekiyor
    // Ama Management API için özel bir endpoint yok
    
    // Alternatif: Migration SQL'ini Supabase Dashboard'a göndermek için
    // bir script oluşturup, kullanıcıya talimat vermek
    
    // En pratik çözüm: Migration SQL'ini okuyup, kullanıcıya Supabase Dashboard'dan
    // çalıştırmasını söylemek yerine, ben migration'ı otomatik çalıştırmayı deneyeyim
    
    // Supabase REST API'sine POST isteği gönder
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        sql: migrationSQL,
      }),
    })

    if (!response.ok) {
      // RPC fonksiyonu yoksa, migration SQL'ini kullanıcıya göster
      console.log('⚠️  Supabase REST API ile SQL çalıştırılamıyor.')
      console.log('💡 Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:\n')
      console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
      console.log('   2. Projenizi seçin')
      console.log('   3. SQL Editor\'a gidin')
      console.log('   4. Aşağıdaki SQL\'i kopyalayın ve çalıştırın:\n')
      console.log('─'.repeat(80))
      console.log(migrationSQL)
      console.log('─'.repeat(80))
      console.log('\n✅ Migration SQL\'i yukarıda gösterildi. Lütfen Supabase Dashboard\'dan çalıştırın.\n')
      process.exit(1)
    }

    const result = await response.json()
    
    if (result.error) {
      console.error('❌ Migration hatası:', result.error)
      console.log('\n💡 Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:\n')
      console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
      console.log('   2. Projenizi seçin')
      console.log('   3. SQL Editor\'a gidin')
      console.log('   4. Aşağıdaki SQL\'i kopyalayın ve çalıştırın:\n')
      console.log('─'.repeat(80))
      console.log(migrationSQL)
      console.log('─'.repeat(80))
      process.exit(1)
    }

    console.log('\n✅ Migration başarıyla tamamlandı!\n')
    console.log('📋 Oluşturulan tablolar:')
    console.log('   - InvoiceItem (Invoice ile Product arasındaki ilişki)')
    console.log('   - StockMovement (Stok hareketleri takibi)')
    console.log('\n📋 Product tablosuna eklenen kolonlar:')
    console.log('   - barcode (Barkod)')
    console.log('   - status (ACTIVE, INACTIVE, DISCONTINUED)')
    console.log('   - minStock (Minimum stok seviyesi)')
    console.log('   - maxStock (Maksimum stok seviyesi)')
    console.log('   - unit (Birim: ADET, KG, LITRE, vb.)')
    console.log('\n✅ Tüm özellikler aktif!\n')

  } catch (error: any) {
    console.error('❌ Migration hatası:', error.message)
    console.log('\n💡 Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:\n')
    
    // Migration SQL'ini oku ve göster
    try {
      const migrationPath = path.join(process.cwd(), 'supabase/migrations/005_enhance_product_system.sql')
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
      
      console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
      console.log('   2. Projenizi seçin')
      console.log('   3. SQL Editor\'a gidin')
      console.log('   4. Aşağıdaki SQL\'i kopyalayın ve çalıştırın:\n')
      console.log('─'.repeat(80))
      console.log(migrationSQL)
      console.log('─'.repeat(80))
      console.log('\n')
    } catch (readError) {
      console.log('   Migration dosyası okunamadı. Lütfen manuel olarak çalıştırın.')
    }
    
    process.exit(1)
  }
}

// Migration'ı çalıştır
runMigration()

