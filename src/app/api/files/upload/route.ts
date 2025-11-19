import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string | null // 'Customer', 'Deal', 'Quote', etc. (opsiyonel)
    const entityId = formData.get('entityId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Entity type ve ID opsiyonel (Documents modülü için)
    // Eğer verilmişse kullan, yoksa genel documents klasörüne yükle

    // Dosya boyutu kontrolü (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole() // Storage bucket'ları listelemek için service role gerekli

    // Supabase Storage'a yükle
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Bucket adını belirle: Product için 'products', diğer entity'ler için 'crm-files', genel için 'documents'
    let bucketName = 'documents' // Default bucket
    if (entityType && entityId) {
      if (entityType === 'Product') {
        bucketName = 'products' // Product için özel bucket
      } else {
        bucketName = 'crm-files' // Diğer entity'ler için
      }
    }
    
    // Bucket'ın var olup olmadığını kontrol et ve yoksa oluşturmayı dene
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (!bucketsError && buckets) {
      const bucketExists = buckets.some(b => b.name === bucketName)
      if (!bucketExists) {
        // Bucket yoksa oluşturmayı dene (public bucket olarak)
        try {
          const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true, // Fotoğrafların görüntülenmesi için public
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          })
          
          if (createError) {
            // Bucket oluşturulamazsa 'documents' bucket'ını kullan (fallback)
            console.warn(`Bucket '${bucketName}' oluşturulamadı, 'documents' bucket'ına fallback yapılıyor:`, createError.message)
            bucketName = 'documents'
            
            // documents bucket'ı da yoksa hata ver
            const documentsExists = buckets.some(b => b.name === 'documents')
            if (!documentsExists) {
              return NextResponse.json(
                { 
                  error: `Storage bucket'ları bulunamadı. Lütfen Supabase Storage'da '${bucketName}' veya 'documents' bucket'ını oluşturun.`,
                  bucketName,
                  details: 'Hiçbir bucket bulunamadı. Lütfen Supabase Dashboard > Storage > Create bucket ile en az bir bucket oluşturun.'
                },
                { status: 404 }
              )
            }
          } else {
            console.log(`✅ Bucket '${bucketName}' başarıyla oluşturuldu`)
          }
        } catch (createBucketError: any) {
          // Bucket oluşturma hatası - fallback yap
          console.warn(`Bucket '${bucketName}' oluşturulamadı:`, createBucketError.message)
          bucketName = 'documents'
        }
      }
    }
    
    // Dosya path'ini oluştur (bucket kontrolünden SONRA, bucket'a göre)
    const timestamp = Date.now()
    let filePath: string
    
    if (entityType && entityId) {
      // Entity'ye bağlı dosya: companyId/entityType/entityId/timestamp-filename
      // ÖNEMLİ: filePath'te bucket adı prefix'i YOK, sadece klasör yapısı
      filePath = `${session.user.companyId}/${entityType}/${entityId}/${timestamp}-${file.name}`
    } else {
      // Genel documents klasörüne: companyId/documents/timestamp-filename
      // ÖNEMLİ: filePath'te bucket adı prefix'i YOK, sadece klasör yapısı
      filePath = `${session.user.companyId}/documents/${timestamp}-${file.name}`
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      // Bucket hatası varsa daha açıklayıcı mesaj ver
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: `Storage bucket '${bucketName}' bulunamadı. Lütfen Supabase Storage'da '${bucketName}' bucket'ını oluşturun.`,
            bucketName,
            details: uploadError.message 
          },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Public URL oluştur
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // ActivityLog kaydı (entityType varsa)
    if (entityType && entityId) {
      try {
        await supabase.from('ActivityLog').insert([
          {
            entity: entityType,
            action: 'FILE_UPLOAD',
            description: `Dosya yüklendi: ${file.name}`,
            meta: {
              entity: entityType,
              action: 'file_upload',
              entityId,
              fileName: file.name,
              filePath,
              fileSize: file.size,
              fileType: file.type,
              url: urlData.publicUrl,
            },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ] as any)
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('ActivityLog error:', activityError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        url: urlData.publicUrl,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

