import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'

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

    const supabase = getSupabase()

    // Dosya adını oluştur
    const timestamp = Date.now()
    let fileName: string
    let filePath: string
    
    if (entityType && entityId) {
      // Entity'ye bağlı dosya: companyId/entityType/entityId/timestamp-filename
      fileName = `${session.user.companyId}/${entityType}/${entityId}/${timestamp}-${file.name}`
      filePath = `attachments/${fileName}`
    } else {
      // Genel documents klasörüne: companyId/documents/timestamp-filename
      fileName = `${session.user.companyId}/documents/${timestamp}-${file.name}`
      filePath = `documents/${fileName}`
    }

    // Supabase Storage'a yükle (documents bucket kullan)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const bucketName = entityType && entityId ? 'crm-files' : 'documents' // Documents modülü için 'documents' bucket
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
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

