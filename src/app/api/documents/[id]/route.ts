import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { documentUpdateSchema } from '@/lib/validations/documents'

export async function GET(
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
    const canRead = await hasPermission('documents', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: documentId } = await params
    const { data, error } = await supabase
      .from('Document')
      .select(`
        *,
        uploadedBy:User!Document_uploadedBy_fkey(id, name, email),
        access:DocumentAccess(
          id,
          userId,
          customerId,
          accessLevel,
          expiresAt,
          User:User!DocumentAccess_userId_fkey(id, name, email),
          Customer:Customer!DocumentAccess_customerId_fkey(id, name)
        )
      `)
      .eq('id', documentId)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Document fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const canUpdate = await hasPermission('documents', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: documentId } = await params
    const body = await request.json()

    // Zod validation
    const validationResult = documentUpdateSchema.safeParse(body)
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

    // Update document
    const { data, error } = await supabase
      .from('Document')
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // Activity log
    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'Document',
      entityId: documentId,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated document: ${data.title}`,
      meta: { title: data.title },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Document update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const canDelete = await hasPermission('documents', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: documentId } = await params
    const { error } = await supabase
      .from('Document')
      .delete()
      .eq('id', documentId)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Document',
      entityId: documentId,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted document`,
      meta: { documentId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}

