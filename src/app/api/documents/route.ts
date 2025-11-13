import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { documentCreateSchema } from '@/lib/validations/documents'

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const relatedTo = searchParams.get('relatedTo')
    const relatedId = searchParams.get('relatedId')
    const folder = searchParams.get('folder')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('Document')
      .select(`
        id, title, description, fileUrl, fileName, fileSize, fileType,
        relatedTo, relatedId, folder, tags, createdAt,
        uploadedBy:User!Document_uploadedBy_fkey(id, name, email)
      `, { count: 'exact' })
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (relatedTo) query = query.eq('relatedTo', relatedTo)
    if (relatedId) query = query.eq('relatedId', relatedId)
    if (folder) query = query.eq('folder', folder)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('Document')
      .insert({
        ...validatedData,
        companyId: session.user.companyId,
        uploadedBy: session.user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'Document',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Uploaded document: ${data.title}`,
      meta: { documentId: data.id, fileName: data.fileName },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Document create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create document' },
      { status: 500 }
    )
  }
}



