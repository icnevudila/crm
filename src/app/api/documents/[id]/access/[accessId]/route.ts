import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canUpdate = await hasPermission('documents', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: documentId, accessId } = await params

    // Check if access exists and belongs to company
    const { data: access, error: accessError } = await supabase
      .from('DocumentAccess')
      .select('id, documentId, companyId')
      .eq('id', accessId)
      .eq('documentId', documentId)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (accessError || !access) {
      return NextResponse.json(
        { error: 'Erişim kaydı bulunamadı veya erişim izniniz yok' },
        { status: 404 }
      )
    }

    // Delete access
    const { error: deleteError } = await supabase
      .from('DocumentAccess')
      .delete()
      .eq('id', accessId)

    if (deleteError) throw deleteError

    // ActivityLog
    await supabase.from('ActivityLog').insert({
      entity: 'DocumentAccess',
      action: 'DELETE',
      description: `Döküman erişimi kaldırıldı`,
      meta: {
        documentId,
        accessId,
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json({ success: true, message: 'Erişim kaldırıldı' })
  } catch (error: any) {
    console.error('Document access delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Erişim kaldırılamadı' },
      { status: 500 }
    )
  }
}

