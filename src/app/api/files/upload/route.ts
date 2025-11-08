import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string // 'Customer', 'Deal', 'Quote', etc.
    const entityId = formData.get('entityId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID required' }, { status: 400 })
    }

    // Dosya boyutu kontrolü (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Dosya adını oluştur (companyId/entityType/entityId/timestamp-filename)
    const timestamp = Date.now()
    const fileName = `${session.user.companyId}/${entityType}/${entityId}/${timestamp}-${file.name}`
    const filePath = `attachments/${fileName}`

    // Supabase Storage'a yükle
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crm-files')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Public URL oluştur
    const { data: urlData } = supabase.storage
      .from('crm-files')
      .getPublicUrl(filePath)

    // ActivityLog kaydı
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

