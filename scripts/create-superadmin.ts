/**
 * SuperAdmin Hesabı Oluşturma Script'i
 * 
 * Bu script Supabase'e SuperAdmin hesabı ekler.
 * 
 * Kullanım:
 * npx tsx scripts/create-superadmin.ts
 * 
 * Veya:
 * npm run create-superadmin
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ HATA: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variable\'ları gerekli!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

async function createSuperAdmin() {
  try {
    console.log('🚀 SuperAdmin hesabı oluşturuluyor...\n')

    // Önce bir Company oluştur (SuperAdmin için özel company)
    const { data: company, error: companyError } = await supabase
      .from('Company')
      .insert([
        {
          name: 'CRM System',
          sector: 'Sistem',
          city: 'İstanbul',
          status: 'ACTIVE',
        },
      ])
      .select()
      .single()

    if (companyError && !companyError.message.includes('duplicate')) {
      console.error('❌ Company oluşturma hatası:', companyError)
      // Eğer company zaten varsa devam et
      if (!companyError.message.includes('duplicate')) {
        throw companyError
      }
    }

    // Eğer company zaten varsa, onu bul
    let companyId = company?.id
    if (!companyId) {
      const { data: existingCompany } = await supabase
        .from('Company')
        .select('id')
        .eq('name', 'CRM System')
        .single()
      
      companyId = existingCompany?.id
    }

    if (!companyId) {
      throw new Error('Company oluşturulamadı veya bulunamadı')
    }

    console.log('✅ Company oluşturuldu/bulundu:', companyId)

    // Şifreyi hash'le
    const password = 'superadmin123' // Varsayılan şifre
    const hashedPassword = await bcrypt.hash(password, 10)

    // SuperAdmin kullanıcısını oluştur
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert([
        {
          name: 'Super Admin',
          email: 'superadmin@crm.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          companyId: companyId,
        },
      ])
      .select()
      .single()

    if (userError) {
      if (userError.message.includes('duplicate') || userError.message.includes('unique')) {
        console.log('⚠️  SuperAdmin hesabı zaten mevcut!')
        console.log('\n📧 Mevcut SuperAdmin Giriş Bilgileri:')
        console.log('   Email: superadmin@crm.com')
        console.log('   Şifre: superadmin123')
        console.log('   Rol: SUPER_ADMIN')
        return
      }
      throw userError
    }

    console.log('✅ SuperAdmin hesabı oluşturuldu!\n')
    console.log('📧 SuperAdmin Giriş Bilgileri:')
    console.log('   Email: superadmin@crm.com')
    console.log('   Şifre: superadmin123')
    console.log('   Rol: SUPER_ADMIN')
    console.log('   Company ID:', companyId)
    console.log('   ⚠️  ÖNEMLİ: SuperAdmin giriş yaparken herhangi bir şirket seçebilir, sistem otomatik olarak SuperAdmin\'in kendi şirketini kullanır.')
    console.log('\n⚠️  ÖNEMLİ: İlk girişten sonra şifreyi değiştirmenizi öneririz!')
  } catch (error: any) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

// Script'i çalıştır
createSuperAdmin()
  .then(() => {
    console.log('\n✅ İşlem tamamlandı!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Beklenmeyen hata:', error)
    process.exit(1)
  })

