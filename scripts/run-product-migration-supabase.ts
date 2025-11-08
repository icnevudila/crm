/**
 * Product System Enhancement Migration Script (Supabase Client ile)
 * InvoiceItem, StockMovement tabloları ve Product tablosuna yeni kolonlar ekler
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

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

    // Supabase client oluştur (Service Role Key ile - RLS bypass)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Migration SQL dosyasını oku
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/005_enhance_product_system.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration dosyası bulunamadı: ${migrationPath}`)
      process.exit(1)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL dosyası okundu\n')
    console.log('🔌 Supabase\'e bağlanılıyor...\n')

    // SQL'i Supabase RPC ile çalıştır
    // NOT: Supabase'de SQL çalıştırmak için rpc kullanmamız gerekiyor
    // Ama daha iyi yöntem: Supabase Management API kullanmak veya doğrudan SQL Editor'dan çalıştırmak
    
    // Alternatif: SQL'i parçalara böl ve her birini ayrı ayrı çalıştır
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📋 ${statements.length} SQL statement bulundu\n`)

    // Her statement'ı çalıştır
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⏳ Statement ${i + 1}/${statements.length} çalıştırılıyor...`)
      
      try {
        // Supabase'de SQL çalıştırmak için rpc kullanıyoruz
        // Ama bu çalışmayabilir, o yüzden kullanıcıya manuel çalıştırmasını söyleyelim
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // RPC yoksa, kullanıcıya manuel çalıştırmasını söyle
          console.log('\n⚠️  Supabase RPC ile SQL çalıştırılamıyor.')
          console.log('💡 Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:\n')
          console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
          console.log('   2. Projenizi seçin')
          console.log('   3. SQL Editor\'a gidin')
          console.log('   4. supabase/migrations/005_enhance_product_system.sql dosyasının içeriğini kopyalayın')
          console.log('   5. SQL Editor\'a yapıştırın ve "Run" butonuna tıklayın\n')
          process.exit(1)
        }
      } catch (err: any) {
        console.log('\n⚠️  Supabase RPC ile SQL çalıştırılamıyor.')
        console.log('💡 Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:\n')
        console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
        console.log('   2. Projenizi seçin')
        console.log('   3. SQL Editor\'a gidin')
        console.log('   4. supabase/migrations/005_enhance_product_system.sql dosyasının içeriğini kopyalayın')
        console.log('   5. SQL Editor\'a yapıştırın ve "Run" butonuna tıklayın\n')
        process.exit(1)
      }
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
    console.log('\n💡 ÇÖZÜM: Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:\n')
    console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
    console.log('   2. Projenizi seçin')
    console.log('   3. SQL Editor\'a gidin')
    console.log('   4. supabase/migrations/005_enhance_product_system.sql dosyasının içeriğini kopyalayın')
    console.log('   5. SQL Editor\'a yapıştırın ve "Run" butonuna tıklayın\n')
    process.exit(1)
  }
}

// Migration'ı çalıştır
runMigration()

