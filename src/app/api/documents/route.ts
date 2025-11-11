import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const relatedTo = searchParams.get('relatedTo')
    const relatedId = searchParams.get('relatedId')
    const folder = searchParams.get('folder')

    // RLS: Set company context
    await supabase.rpc('set_config', {
      name: 'app.current_company_id',
      value: session.user.companyId,
    })

    let query = supabase
      .from('Document')
      .select(`
        id, title, description, fileUrl, fileName, fileSize, fileType,
        relatedTo, relatedId, folder, tags, createdAt,
        uploadedBy:User!Document_uploadedBy_fkey(id, name, email)
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (relatedTo) query = query.eq('relatedTo', relatedTo)
    if (relatedId) query = query.eq('relatedId', relatedId)
    if (folder) query = query.eq('folder', folder)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validation
    if (!body.title || !body.fileUrl || !body.fileName) {
      return NextResponse.json(
        { error: 'Title, fileUrl, and fileName are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('Document')
      .insert({
        ...body,
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



