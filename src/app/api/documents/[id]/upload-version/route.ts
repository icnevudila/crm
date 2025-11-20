import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { documentCreateSchema } from '@/lib/validations/documents'

// Yeni versiyon yükleme endpoint'i
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canCreate = await hasPermission('documents', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: parentDocumentId } = await params
    const body = await request.json()

    // Zod validation
    const validationResult = documentCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Parent dokümanı kontrol et
    const { data: parentDocument, error: parentError } = await supabase
      .from('Document')
      .select('id, title, relatedTo, relatedId, folder, companyId')
      .eq('id', parentDocumentId)
      .eq('companyId', session.user.companyId)
      .single()

    if (parentError || !parentDocument) {
      return NextResponse.json({ error: 'Parent document not found' }, { status: 404 })
    }

    // Yeni versiyon oluştur (parentDocumentId ile)
    const { data: newVersion, error: createError } = await supabase
      .from('Document')
      .insert({
        ...validatedData,
        parentDocumentId: parentDocument.id,
        companyId: session.user.companyId,
        uploadedBy: session.user.id,
        relatedTo: parentDocument.relatedTo,
        relatedId: parentDocument.relatedId,
        folder: parentDocument.folder,
        // version ve isLatestVersion trigger tarafından otomatik set edilecek
      })
      .select()
      .single()

    if (createError) throw createError

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'Document',
      entityId: newVersion.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `New version uploaded: ${newVersion.title} (v${newVersion.version})`,
      meta: { 
        documentId: newVersion.id, 
        parentDocumentId: parentDocument.id,
        version: newVersion.version,
        fileName: newVersion.fileName 
      },
    })

    return NextResponse.json(newVersion, { status: 201 })
  } catch (error: any) {
    console.error('Document version upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload document version' },
      { status: 500 }
    )
  }
}






