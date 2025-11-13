import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { z } from 'zod'

const accessCreateSchema = z.object({
  userId: z.string().uuid().nullable(),
  customerId: z.string().uuid().nullable(),
  accessLevel: z.enum(['VIEW', 'DOWNLOAD', 'EDIT']),
  expiresAt: z.string().datetime().nullable().optional(),
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const canUpdate = await hasPermission('documents', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: documentId } = await params
    const body = await request.json()

    // Validation
    const validatedData = accessCreateSchema.parse(body)

    // Check if userId or customerId is provided
    if (!validatedData.userId && !validatedData.customerId) {
      return NextResponse.json(
        { error: 'Kullanıcı veya müşteri seçilmelidir' },
        { status: 400 }
      )
    }

    // Check if document exists and belongs to company
    const { data: document, error: docError } = await supabase
      .from('Document')
      .select('id, companyId')
      .eq('id', documentId)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Döküman bulunamadı veya erişim izniniz yok' },
        { status: 404 }
      )
    }

    // Check if access already exists
    const accessQuery = supabase
      .from('DocumentAccess')
      .select('id')
      .eq('documentId', documentId)
      .eq('companyId', session.user.companyId)

    if (validatedData.userId) {
      accessQuery.eq('userId', validatedData.userId)
    } else if (validatedData.customerId) {
      accessQuery.eq('customerId', validatedData.customerId)
    }

    const { data: existingAccess } = await accessQuery.maybeSingle()

    if (existingAccess) {
      // Update existing access
      const { data, error } = await supabase
        .from('DocumentAccess')
        .update({
          accessLevel: validatedData.accessLevel,
          expiresAt: validatedData.expiresAt || null,
        })
        .eq('id', existingAccess.id)
        .select()
        .single()

      if (error) throw error

      // ActivityLog
      await supabase.from('ActivityLog').insert({
        entity: 'DocumentAccess',
        action: 'UPDATE',
        description: `Döküman erişimi güncellendi`,
        meta: {
          documentId,
          accessId: data.id,
          accessLevel: validatedData.accessLevel,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })

      return NextResponse.json(data)
    } else {
      // Create new access
      const { data, error } = await supabase
        .from('DocumentAccess')
        .insert({
          documentId,
          userId: validatedData.userId,
          customerId: validatedData.customerId,
          accessLevel: validatedData.accessLevel,
          expiresAt: validatedData.expiresAt || null,
          companyId: session.user.companyId,
        })
        .select()
        .single()

      if (error) throw error

      // ActivityLog
      await supabase.from('ActivityLog').insert({
        entity: 'DocumentAccess',
        action: 'CREATE',
        description: `Döküman erişimi eklendi`,
        meta: {
          documentId,
          accessId: data.id,
          accessLevel: validatedData.accessLevel,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })

      return NextResponse.json(data, { status: 201 })
    }
  } catch (error: any) {
    console.error('Document access create error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Erişim eklenemedi' },
      { status: 500 }
    )
  }
}

