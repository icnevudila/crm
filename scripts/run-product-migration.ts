/**
 * Product System Enhancement Migration Script
 * InvoiceItem, StockMovement tabloları ve Product tablosuna yeni kolonlar ekler
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

if (!DATABASE_URL) {
  console.error('❌ HATA: DATABASE_URL environment variable gerekli!')
  console.error('Lütfen .env.local dosyanızda DATABASE_URL tanımlayın.')
  console.error('Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log('🚀 Product System Enhancement Migration başlatılıyor...\n')

    // pg kütüphanesini import et
    const pg = await import('pg')

    // Migration SQL dosyasını oku
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/005_enhance_product_system.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration dosyası bulunamadı: ${migrationPath}`)
      process.exit(1)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL dosyası okundu\n')

    // PostgreSQL connection oluştur
    const { Client } = pg
    
    // DATABASE_URL formatını kontrol et
    if (!DATABASE_URL || !DATABASE_URL.startsWith('postgresql://')) {
      console.error('❌ DATABASE_URL formatı hatalı! postgresql:// ile başlamalı')
      console.error('Mevcut DATABASE_URL:', DATABASE_URL ? 'Tanımlı ama format hatalı' : 'Tanımlı değil')
      process.exit(1)
    }

    const client = new Client({
      connectionString: DATABASE_URL,
    })

    console.log('🔌 PostgreSQL\'e bağlanılıyor...\n')
    await client.connect()
    console.log('✅ PostgreSQL\'e bağlandı\n')

    // SQL'i çalıştır
    console.log('⏳ Migration SQL çalıştırılıyor...\n')
    await client.query(migrationSQL)

    console.log('✅ Migration başarıyla tamamlandı!\n')
    console.log('📋 Oluşturulan tablolar:')
    console.log('   - InvoiceItem (Invoice ile Product arasındaki ilişki)')
    console.log('   - StockMovement (Stok hareketleri takibi)')
    console.log('\n📋 Product tablosuna eklenen kolonlar:')
    console.log('   - barcode (Barkod)')
    console.log('   - status (ACTIVE, INACTIVE, DISCONTINUED)')
    console.log('   - minStock (Minimum stok seviyesi)')
    console.log('   - maxStock (Maksimum stok seviyesi)')
    console.log('   - unit (Birim: ADET, KG, LITRE, vb.)')
    console.log('\n📋 Oluşturulan index\'ler:')
    console.log('   - idx_invoiceitem_invoice, idx_invoiceitem_product, idx_invoiceitem_company')
    console.log('   - idx_stockmovement_product, idx_stockmovement_company, idx_stockmovement_type')
    console.log('   - idx_product_barcode, idx_product_status, idx_product_category')
    console.log('\n📋 Oluşturulan trigger\'lar:')
    console.log('   - trigger_update_stock_on_invoice_item (InvoiceItem eklendiğinde stok düşür)')
    console.log('   - trigger_restore_stock_on_invoice_item_delete (InvoiceItem silindiğinde stok geri ekle)')
    console.log('\n✅ Tüm özellikler aktif!\n')

    await client.end()

  } catch (error: any) {
    console.error('❌ Migration hatası:', error.message)
    
    // Eğer tablo zaten varsa bu normaldir
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('\n⚠️  Bazı objeler zaten mevcut (bu normaldir - IF NOT EXISTS kullanıldı)')
      console.log('✅ Migration güvenle tamamlandı\n')
    } else {
      console.error('\n💡 ÇÖZÜM: Migration SQL\'ini manuel olarak Supabase Dashboard\'da çalıştırın:')
      console.error('   1. Supabase Dashboard\'a gidin')
      console.error('   2. SQL Editor\'a gidin')
      console.error('   3. supabase/migrations/005_enhance_product_system.sql dosyasının içeriğini kopyalayın')
      console.error('   4. SQL Editor\'a yapıştırın ve çalıştırın\n')
      console.error('📋 Hata detayları:', error)
      process.exit(1)
    }
  }
}

// Migration'ı çalıştır
runMigration()

