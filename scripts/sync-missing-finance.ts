/**
 * Eksik Finance kayıtlarını oluştur
 * PAID invoice'lar için Finance kaydı yoksa oluşturur
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env dosyasını yükle
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncMissingFinance() {
  try {
    console.log('🔍 PAID invoice\'lar kontrol ediliyor...')

    // Tüm PAID invoice'ları çek
    const { data: paidInvoices, error: invoiceError } = await supabase
      .from('Invoice')
      .select('id, total, companyId, status, title')
      .eq('status', 'PAID')

    if (invoiceError) {
      console.error('❌ Invoice çekme hatası:', invoiceError)
      return
    }

    if (!paidInvoices || paidInvoices.length === 0) {
      console.log('✅ PAID invoice bulunamadı')
      return
    }

    console.log(`📊 Toplam ${paidInvoices.length} PAID invoice bulundu`)

    // Her invoice için Finance kaydı var mı kontrol et
    const financeRecordsToCreate: any[] = []
    let skippedCount = 0

    for (const invoice of paidInvoices) {
      // Bu invoice için Finance kaydı var mı kontrol et
      const { data: existingFinance } = await supabase
        .from('Finance')
        .select('id')
        .eq('relatedTo', `Invoice: ${invoice.id}`)
        .eq('companyId', invoice.companyId)
        .maybeSingle()

      // Eğer Finance kaydı yoksa oluştur
      if (!existingFinance) {
        financeRecordsToCreate.push({
          type: 'INCOME',
          amount: invoice.total || 0,
          relatedTo: `Invoice: ${invoice.id}`,
          companyId: invoice.companyId,
        })
        console.log(`➕ Eksik kayıt bulundu: Invoice ${invoice.id} (${invoice.title || 'Başlıksız'})`)
      } else {
        skippedCount++
      }
    }

    if (financeRecordsToCreate.length === 0) {
      console.log(`✅ Tüm PAID invoice'lar için Finance kaydı mevcut (${skippedCount} kayıt)`)
      return
    }

    console.log(`\n📝 ${financeRecordsToCreate.length} eksik Finance kaydı oluşturuluyor...`)

    // Eksik Finance kayıtlarını oluştur
    const { data: createdFinance, error: financeError } = await supabase
      .from('Finance')
      .insert(financeRecordsToCreate)
      .select()

    if (financeError) {
      console.error('❌ Finance kayıtları oluşturma hatası:', financeError)
      return
    }

    const createdCount = createdFinance?.length || 0

    console.log(`✅ ${createdCount} Finance kaydı başarıyla oluşturuldu!`)
    console.log(`⏭️  ${skippedCount} kayıt zaten mevcut (atlandı)`)

    // ActivityLog kayıtları oluştur
    if (createdFinance && createdFinance.length > 0) {
      const activityLogs = createdFinance.map((finance: any) => {
        const invoiceId = finance.relatedTo?.replace('Invoice: ', '')
        return {
          entity: 'Finance',
          action: 'CREATE',
          description: `Eksik finans kaydı oluşturuldu: Fatura ${invoiceId}`,
          meta: { 
            entity: 'Finance', 
            action: 'create', 
            id: finance.id, 
            fromInvoice: invoiceId,
            synced: true,
          },
          userId: null, // System tarafından oluşturuldu
          companyId: finance.companyId,
        }
      })

      await supabase.from('ActivityLog').insert(activityLogs)
      console.log(`📋 ${activityLogs.length} ActivityLog kaydı oluşturuldu`)
    }

    console.log('\n✨ Senkronizasyon tamamlandı!')
    console.log(`📊 Özet:`)
    console.log(`   - Toplam PAID Invoice: ${paidInvoices.length}`)
    console.log(`   - Yeni oluşturulan: ${createdCount}`)
    console.log(`   - Zaten mevcut: ${skippedCount}`)

  } catch (error: any) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

syncMissingFinance()

