/**
 * Aktif müşteri firmalarına rastgele sektör atama scripti
 * 
 * Kullanım:
 * npx ts-node scripts/assign-random-sectors.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local dosyasından environment variable'ları yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL ve Service Role Key gerekli!')
  console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variable\'larını kontrol edin.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Önceden tanımlı sektörler (CompanyForm ile aynı)
const SECTORS = [
  'Teknoloji',
  'Yazılım',
  'Sağlık',
  'Eğitim',
  'Gıda',
  'İnşaat',
  'Otomotiv',
  'Enerji',
  'Finans',
  'Perakende',
  'Lojistik',
  'Turizm',
  'Medya',
  'Danışmanlık',
  'Üretim',
  'Tarım',
  'Kimya',
  'Tekstil',
  'İlaç',
  'Telekomünikasyon',
  'Gayrimenkul',
  'Emlak',
  'Hukuk',
  'Muhasebe',
  'Pazarlama',
  'Reklam',
  'Tasarım',
  'Mimarlık',
  'Mühendislik',
  'Diğer',
]

async function assignRandomSectors() {
  try {
    console.log('🔄 Aktif müşteri firmalarına rastgele sektör atanıyor...')

    // Tüm aktif müşteri firmalarını çek (sector null veya boş olanlar)
    const { data: companies, error: fetchError } = await supabase
      .from('CustomerCompany')
      .select('id, name, sector, status')
      .eq('status', 'ACTIVE')
      .or('sector.is.null,sector.eq.')
    
    // Eğer hiç firma yoksa, tüm aktif firmalara sektör ata (sector kontrolü yapmadan)
    if (!companies || companies.length === 0) {
      const { data: allCompanies, error: allFetchError } = await supabase
        .from('CustomerCompany')
        .select('id, name, sector, status')
        .eq('status', 'ACTIVE')
        .limit(1000)
      
      if (allFetchError) {
        console.error('❌ Tüm müşteri firmaları çekilirken hata:', allFetchError)
        return
      }
      
      if (!allCompanies || allCompanies.length === 0) {
        console.log('✅ Sektör atanacak aktif firma bulunamadı.')
        return
      }
      
      console.log(`📊 ${allCompanies.length} aktif firma bulundu (tümüne sektör atanacak).`)
      
      // Her firmaya rastgele sektör ata
      let updated = 0
      let errors = 0
      
      for (const company of allCompanies) {
        // Rastgele sektör seç
        const randomSector = SECTORS[Math.floor(Math.random() * SECTORS.length)]
        
        const { error: updateError } = await supabase
          .from('CustomerCompany')
          .update({ sector: randomSector })
          .eq('id', company.id)
        
        if (updateError) {
          console.error(`❌ ${company.name} firmasına sektör atanırken hata:`, updateError)
          errors++
        } else {
          console.log(`✅ ${company.name} → ${randomSector}`)
          updated++
        }
      }
      
      console.log(`\n✅ Tamamlandı!`)
      console.log(`   - Güncellenen: ${updated}`)
      console.log(`   - Hata: ${errors}`)
      return
    }

    if (fetchError) {
      console.error('❌ Müşteri firmaları çekilirken hata:', fetchError)
      return
    }

    if (!companies || companies.length === 0) {
      console.log('✅ Sektör atanacak aktif firma bulunamadı.')
      return
    }

    console.log(`📊 ${companies.length} aktif firma bulundu.`)

    // Her firmaya rastgele sektör ata
    let updated = 0
    let errors = 0

    for (const company of companies) {
      // Rastgele sektör seç
      const randomSector = SECTORS[Math.floor(Math.random() * SECTORS.length)]

      const { error: updateError } = await supabase
        .from('CustomerCompany')
        .update({ sector: randomSector })
        .eq('id', company.id)

      if (updateError) {
        console.error(`❌ ${company.name} firmasına sektör atanırken hata:`, updateError)
        errors++
      } else {
        console.log(`✅ ${company.name} → ${randomSector}`)
        updated++
      }
    }

    console.log(`\n✅ Tamamlandı!`)
    console.log(`   - Güncellenen: ${updated}`)
    console.log(`   - Hata: ${errors}`)
  } catch (error: any) {
    console.error('❌ Script hatası:', error)
    process.exit(1)
  }
}

// Script'i çalıştır
assignRandomSectors()
  .then(() => {
    console.log('✅ Script başarıyla tamamlandı.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script hatası:', error)
    process.exit(1)
  })

