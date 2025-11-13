import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-low-stock",
//     "schedule": "0 9 * * *"
//   }]
// }

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    // Vercel Cron secret kontrolü (güvenlik için)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Düşük stoklu ürünleri bul (stock <= minimumStock ve minimumStock > 0)
    // NOT: Supabase'de lte ile raw SQL kullanılamaz, bu yüzden tüm ürünleri çekip filtreleyeceğiz
    const { data: allProducts, error: findError } = await supabase
      .from('Product')
      .select('id, name, stock, minimumStock, companyId')
      .not('minimumStock', 'is', null)
      .gt('minimumStock', 0)
    
    // Client-side filtreleme: stock <= minimumStock
    const lowStockProducts = allProducts?.filter((product: any) => 
      product.stock !== null && 
      product.minimumStock !== null && 
      product.stock <= product.minimumStock
    ) || []

    if (findError) {
      console.error('Check Low Stock - Find Error:', findError)
      return NextResponse.json(
        { error: 'Düşük stoklu ürünler alınamadı', details: findError.message },
        { status: 500 }
      )
    }

    if (!lowStockProducts || lowStockProducts.length === 0) {
      return NextResponse.json({
        message: 'Düşük stoklu ürün bulunamadı',
        count: 0,
        date: new Date().toISOString().split('T')[0],
      })
    }

    // Her ürün için bildirim gönder (eğer daha önce gönderilmemişse)
    let notificationCount = 0
    const companyIds = [...new Set(lowStockProducts.map((product: any) => product.companyId))]

    for (const companyId of companyIds) {
      const companyProducts = lowStockProducts.filter((product: any) => product.companyId === companyId)

      // Şirket bazlı toplu bildirim (tüm düşük stoklu ürünler için)
      try {
        // Daha önce bugün bildirim gönderilmiş mi kontrol et
        const today = new Date().toISOString().split('T')[0]
        const { data: existingNotification } = await supabase
          .from('Notification')
          .select('id')
          .eq('companyId', companyId)
          .eq('title', 'Düşük Stok Uyarısı')
          .gte('createdAt', `${today}T00:00:00`)
          .maybeSingle()

        // Eğer bugün bildirim gönderilmemişse gönder
        if (!existingNotification) {
          const productNames = companyProducts.map((p: any) => p.name).join(', ')
          const productCount = companyProducts.length

          await createNotificationForRole({
            companyId,
            role: ['ADMIN', 'SUPER_ADMIN'],
            title: 'Düşük Stok Uyarısı',
            message: `${productCount} ürünün stoku minimum seviyenin altına düştü: ${productNames}`,
            type: 'warning',
            priority: 'high',
            relatedTo: 'Product',
            relatedId: companyProducts[0]?.id || null,
          })
          notificationCount++
        }
      } catch (error: any) {
        console.error(`Error processing company ${companyId}:`, error)
        // Hata olsa bile diğer şirketleri işlemeye devam et
      }
    }

    return NextResponse.json({
      message: 'Düşük stoklu ürünler kontrol edildi',
      totalProducts: lowStockProducts.length,
      notificationsSent: notificationCount,
      date: new Date().toISOString().split('T')[0],
    })
  } catch (error: any) {
    console.error('Check Low Stock - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Düşük stok kontrolü gerçekleştirilemedi' },
      { status: 500 }
    )
  }
}

