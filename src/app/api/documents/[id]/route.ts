import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('Document')
      .select(`
        *,
        uploadedBy:User!Document_uploadedBy_fkey(id, name, email),
        access:DocumentAccess(id, userId, accessLevel, expiresAt)
      `)
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update document
    const { data, error } = await supabase
      .from('Document')
      .update({
        title: body.title,
        description: body.description,
        folder: body.folder,
        relatedTo: body.relatedTo || null,
        relatedId: body.relatedId || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // Activity log
    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'Document',
      entityId: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('Document')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Document',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted document`,
      meta: { documentId: params.id },
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

