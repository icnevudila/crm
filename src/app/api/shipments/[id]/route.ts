import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('shipment', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Debug: ID ve companyId kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('Shipment detail API - Request:', {
        id,
        companyId: session.user.companyId,
        isSuperAdmin: session.user.role === 'SUPER_ADMIN',
      })
    }

    // Shipment'ı çek (Invoice'ı ayrı query ile çekeceğiz - ilişki hatası nedeniyle)
    // ÖNEMLİ: SuperAdmin için companyId kontrolü yapma
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    let shipmentQuery = supabase
      .from('Shipment')
      .select(`
        id, tracking, status, invoiceId, companyId, createdAt, updatedAt, estimatedDelivery
      `)
      .eq('id', id)
    
    // SuperAdmin değilse companyId kontrolü yap
    if (session.user.role !== 'SUPER_ADMIN') {
      shipmentQuery = shipmentQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: shipmentData, error } = await shipmentQuery.maybeSingle()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipment detail API - Error:', error)
      }
      return NextResponse.json({ error: error.message || 'Sevkiyat bulunamadı' }, { status: 500 })
    }

    if (!shipmentData) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipment detail API - Not found:', {
          id,
          companyId: session.user.companyId,
          isSuperAdmin: session.user.role === 'SUPER_ADMIN',
        })
      }
      return NextResponse.json({ error: 'Sevkiyat bulunamadı' }, { status: 404 })
    }

    // Debug: invoiceId kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('Shipment invoiceId:', (shipmentData as any).invoiceId)
    }

    // Invoice'ı ayrı query ile çek (ilişki hatası nedeniyle)
    let invoiceData = null
    if ((shipmentData as any).invoiceId) {
      try {
        const { data: invoice, error: invoiceError } = await supabase
          .from('Invoice')
          .select(`
            id,
            title,
            invoiceNumber,
            status,
            totalAmount,
            total,
            taxRate,
            discount,
            createdAt,
            updatedAt,
            Customer (
              id,
              name,
              email
            )
          `)
          .eq('id', (shipmentData as any).invoiceId)
          .eq('companyId', session.user.companyId)
          .maybeSingle()
        
        if (invoiceError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Invoice query error:', invoiceError, 'invoiceId:', (shipmentData as any).invoiceId)
          }
        } else if (invoice) {
          // totalAmount'u total olarak da ekle (frontend uyumluluğu için)
          invoiceData = {
            ...invoice,
            total: (invoice as any).totalAmount || (invoice as any).total || 0,
          }
          // Quote ve Deal bilgilerini ayrı çek (eğer varsa)
          if ((invoice as any).quoteId) {
            try {
              const { data: quote } = await supabase
                .from('Quote')
                .select(`
                  id,
                  Deal (
                    id,
                    Customer (
                      id,
                      name,
                      email
                    )
                  )
                `)
                .eq('id', (invoice as any).quoteId)
                .eq('companyId', session.user.companyId)
                .maybeSingle()
              
              if (quote) {
                invoiceData = {
                  ...invoice,
                  Quote: quote,
                }
              } else {
                invoiceData = invoice
              }
            } catch (quoteErr) {
              invoiceData = invoice
            }
          } else {
            invoiceData = invoice
          }
        }
      } catch (invoiceErr) {
        // Invoice çekilemedi, devam et
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice fetch error:', invoiceErr, 'invoiceId:', (shipmentData as any).invoiceId)
        }
      }
    }

    // InvoiceItem'ları çek (sevkiyat içeriği için)
    let invoiceItems = null
    if ((shipmentData as any).invoiceId) {
      try {
        const { data: items } = await supabase
          .from('InvoiceItem')
          .select(
            `
            *,
            Product (
              id,
              name,
              sku,
              barcode,
              stock,
              unit
            )
          `
          )
          .eq('invoiceId', (shipmentData as any).invoiceId)
          .eq('companyId', session.user.companyId)
          .order('createdAt', { ascending: true })
        
        invoiceItems = items || []
      } catch (err) {
        // Hata olsa bile devam et
        if (process.env.NODE_ENV === 'development') {
          console.error('InvoiceItem fetch error:', err)
        }
      }
    }

    // StockMovement'ları çek (sevkiyat ile ilgili)
    let stockMovements = null
    try {
      const { data: movements } = await supabase
        .from('StockMovement')
        .select(
          `
          *,
          Product (
            id,
            name
          ),
          User (
            id,
            name,
            email
          )
        `
        )
        .eq('relatedTo', 'Shipment')
        .eq('relatedId', id)
        .eq('companyId', session.user.companyId)
        .order('createdAt', { ascending: false })
        .limit(50)
      
      stockMovements = movements || []
    } catch (err) {
      // Hata olsa bile devam et
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Shipment&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    return NextResponse.json({
      ...(shipmentData as any),
      Invoice: invoiceData,
      activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
      invoiceItems: invoiceItems || [],
      stockMovements: stockMovements || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Sevkiyat getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('shipment', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()
    
    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // ÖNEMLİ: Onaylı sevkiyatlar güncellenemez (status değişikliği hariç - status endpoint'i kullanılmalı)
    // Mevcut sevkiyat durumunu kontrol et
    let shipmentQuery = supabase
      .from('Shipment')
      .select('status, tracking, companyId')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      shipmentQuery = shipmentQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: currentShipment, error: shipmentError } = await shipmentQuery.maybeSingle()
    
    if (shipmentError || !currentShipment) {
      return NextResponse.json(
        { error: 'Sevkiyat bulunamadı' },
        { status: 404 }
      )
    }

    // ÖNEMLİ: Shipment DELIVERED olduğunda değiştirilemez (Teslim edildiği için)
    if (currentShipment?.status?.toUpperCase() === 'DELIVERED') {
      return NextResponse.json(
        { 
          error: 'Teslim edilmiş sevkiyatlar değiştirilemez',
          message: 'Bu sevkiyat teslim edildi. Sevkiyat bilgilerini değiştirmek mümkün değildir.',
          reason: 'DELIVERED_SHIPMENT_CANNOT_BE_UPDATED'
        },
        { status: 403 }
      )
    }

    if (currentShipment?.status?.toUpperCase() === 'APPROVED') {
      // Onaylı sevkiyatlar için sadece status endpoint'i kullanılabilir (status değişikliği için)
      // Diğer alanlar (tracking, invoiceId, vb.) güncellenemez
      if (body.status && body.status.toUpperCase() !== 'APPROVED') {
        // Status değişikliği yapılıyor - status endpoint'ini kullan
        return NextResponse.json({ 
          error: 'Onaylı sevkiyatlar için durum değişikliği /api/shipments/[id]/status endpoint\'i üzerinden yapılmalıdır',
          message: 'Onaylı sevkiyatların durumunu değiştirmek için özel status endpoint\'ini kullanın.',
          reason: 'APPROVED_SHIPMENT_STATUS_CHANGE'
        }, { status: 400 })
      }
      
      // Onaylı sevkiyatlar için diğer alanlar güncellenemez
      if (body.tracking !== undefined || body.invoiceId !== undefined || 
          body.shippingCompany !== undefined || body.estimatedDelivery !== undefined || 
          body.deliveryAddress !== undefined) {
        return NextResponse.json({ 
          error: 'Onaylı sevkiyatlar düzenlenemez',
          message: 'Bu sevkiyat onaylandı ve stok işlemi yapıldı. Sevkiyat bilgilerini değiştirmek için önce sevkiyatı iptal etmeniz gerekir.',
          reason: 'APPROVED_SHIPMENT_CANNOT_BE_UPDATED'
        }, { status: 400 })
      }
    }

    // Shipment verilerini güncelle
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    // Temel alanlar
    if (body.tracking !== undefined) updateData.tracking = body.tracking || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.invoiceId !== undefined) updateData.invoiceId = body.invoiceId || null
    
    // Schema-extension alanları (varsa güncelle, yoksa Supabase hata vermez - kolon yoksa göz ardı eder)
    if (body.shippingCompany !== undefined) updateData.shippingCompany = body.shippingCompany || null
    if (body.estimatedDelivery !== undefined) updateData.estimatedDelivery = body.estimatedDelivery || null
    if (body.deliveryAddress !== undefined) updateData.deliveryAddress = body.deliveryAddress || null

    // Update işlemi - SuperAdmin için companyId filtresi yok
    let updateQuery = supabase
      .from('Shipment')
      .update(updateData as any)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', session.user.companyId)
    }
    
    const { error: updateError } = await updateQuery

    if (updateError) {
      const { createErrorResponse } = await import('@/lib/error-handling')
      
      if (updateError.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(updateError.code)) {
        return createErrorResponse(updateError)
      }
      
      return NextResponse.json(
        { 
          error: updateError.message || 'Sevkiyat güncellenemedi',
          code: updateError.code || 'UPDATE_ERROR',
        },
        { status: 500 }
      )
    }
    
    // Update başarılı - güncellenmiş veriyi çek (SuperAdmin için companyId filtresi yok)
    let selectQuery = supabase
      .from('Shipment')
      .select(`
        id, tracking, status, invoiceId, companyId, createdAt, updatedAt, estimatedDelivery
      `)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      selectQuery = selectQuery.eq('companyId', session.user.companyId)
    }
    
    const { data, error } = await selectQuery.single()

    if (error) {
      return NextResponse.json(
        { 
          error: error.message || 'Güncellenmiş sevkiyat bulunamadı',
          code: error.code || 'SELECT_ERROR',
        },
        { status: 500 }
      )
    }

    // Shipment DELIVERED olduğunda ActivityLog kaydı (hata olsa bile devam et)
    try {
      if (body.status === 'DELIVERED' && data) {
        await supabase.from('ActivityLog').insert([
          {
            entity: 'Shipment',
            action: 'UPDATE',
            description: `Kargo teslim edildi: ${(data as any)?.tracking || 'Takipsiz'}`,
            meta: { entity: 'Shipment', action: 'delivered', id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      }

      // ActivityLog kaydı
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Shipment',
          action: 'UPDATE',
          description: `Sevkiyat bilgileri güncellendi`,
          meta: { entity: 'Shipment', action: 'update', id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', activityError)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Sevkiyat güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('shipment', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Debug: ID ve companyId kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('Shipment DELETE API - Request:', {
        id,
        companyId: session.user.companyId,
        isSuperAdmin: session.user.role === 'SUPER_ADMIN',
      })
    }

    // ÖNEMLİ: Onaylı ve teslim edilmiş sevkiyatlar silinemez
    // SuperAdmin kontrolü ekle
    let shipmentQuery = supabase
      .from('Shipment')
      .select('status, tracking, invoiceId')
      .eq('id', id)
    
    // SuperAdmin değilse companyId kontrolü yap
    if (session.user.role !== 'SUPER_ADMIN') {
      shipmentQuery = shipmentQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: currentShipment, error: fetchError } = await shipmentQuery.maybeSingle()

    if (fetchError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipment DELETE API - Fetch Error:', fetchError)
      }
      return NextResponse.json({ error: 'Sevkiyat bulunamadı' }, { status: 404 })
    }

    if (!currentShipment) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipment DELETE API - Not found:', {
          id,
          companyId: session.user.companyId,
          isSuperAdmin: session.user.role === 'SUPER_ADMIN',
        })
      }
      return NextResponse.json({ error: 'Sevkiyat bulunamadı' }, { status: 404 })
    }

    // ÖNEMLİ: Shipment DELIVERED olduğunda silinemez (Teslim edildiği için)
    if (currentShipment.status?.toUpperCase() === 'DELIVERED') {
      return NextResponse.json(
        { 
          error: 'Teslim edilmiş sevkiyatlar silinemez',
          message: 'Bu sevkiyat teslim edildi. Sevkiyatı silmek mümkün değildir.',
          reason: 'DELIVERED_SHIPMENT_CANNOT_BE_DELETED'
        },
        { status: 403 }
      )
    }

    // Onaylı sevkiyatlar silinemez
    if (currentShipment.status?.toUpperCase() === 'APPROVED') {
      return NextResponse.json(
        { 
          error: 'Onaylı sevkiyatlar silinemez',
          message: 'Bu sevkiyat onaylandı ve stok işlemi yapıldı. Sevkiyatı silmek için önce sevkiyatı iptal etmeniz ve stok işlemini geri almanız gerekir.',
          reason: 'APPROVED_SHIPMENT_CANNOT_BE_DELETED',
          action: 'Sevkiyatı iptal edip stok işlemini geri alın'
        },
        { status: 403 }
      )
    }

    // Silme işlemi - SuperAdmin kontrolü ekle
    let deleteQuery = supabase
      .from('Shipment')
      .delete()
      .eq('id', id)
    
    // SuperAdmin değilse companyId kontrolü yap
    if (session.user.role !== 'SUPER_ADMIN') {
      deleteQuery = deleteQuery.eq('companyId', session.user.companyId)
    }
    
    const { error } = await deleteQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

      if (currentShipment) {
        try {
          // @ts-expect-error - Supabase database type tanımları eksik
          await supabase.from('ActivityLog').insert([
          {
            entity: 'Shipment',
            action: 'DELETE',
            description: `Sevkiyat silindi: ${(currentShipment as any)?.tracking || 'Takipsiz'}`,
            meta: { entity: 'Shipment', action: 'delete', id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('ActivityLog error:', activityError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Sevkiyat silinemedi' },
      { status: 500 }
    )
  }
}
