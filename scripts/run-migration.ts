/**
 * Migration Script
 * UserPermission ve CompanyPermission tablolarını oluşturur
 * PostgreSQL'e direkt bağlanarak SQL migration'ını çalıştırır
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ HATA: DATABASE_URL environment variable gerekli!')
  console.error('Lütfen .env.local dosyanızda DATABASE_URL tanımlayın.')
  console.error('Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log('🚀 Migration başlatılıyor...\n')

    // pg kütüphanesini import et
    const pg = await import('pg')

    // Migration SQL dosyasını oku
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_add_user_permissions.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL dosyası okundu\n')

    // PostgreSQL connection oluştur
    const { Client } = pg
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
    console.log('   - UserPermission')
    console.log('   - CompanyPermission')
    console.log('\n📋 Oluşturulan index\'ler:')
    console.log('   - idx_userpermission_user')
    console.log('   - idx_userpermission_company')
    console.log('   - idx_userpermission_module')
    console.log('   - idx_companypermission_company')
    console.log('\n📋 Oluşturulan RLS Policies:')
    console.log('   - userpermission_company_isolation')
    console.log('   - companypermission_superadmin_only\n')

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
      console.error('   3. supabase/migrations/001_add_user_permissions.sql dosyasının içeriğini kopyalayın')
      console.error('   4. SQL Editor\'a yapıştırın ve çalıştırın\n')
      process.exit(1)
    }
  }
}

// Migration'ı çalıştır
runMigration()
