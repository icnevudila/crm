import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

const DEFAULT_LIMIT = 50

type ApprovalModule = 'Quote' | 'Deal' | 'Invoice' | 'Contract'

interface ModuleConfig {
  table: string
  select: string
  label: (row: any) => string
  searchColumns: string[]
  orderBy?: string
}

const MODULE_CONFIG: Record<ApprovalModule, ModuleConfig> = {
  Quote: {
    table: 'Quote',
    select: 'id, title, status, totalAmount, companyId, createdAt',
    label: (row) => {
      const title = row.title || 'Teklif'
      const status = row.status || 'Bilinmiyor'
      return `${title} • ${status}`
    },
    searchColumns: ['title'],
  },
  Deal: {
    table: 'Deal',
    select: 'id, title, stage, status, companyId, createdAt',
    label: (row) => {
      const title = row.title || 'Fırsat'
      const stage = row.stage || row.status || 'Bilinmiyor'
      return `${title} • ${stage}`
    },
    searchColumns: ['title'],
  },
  Invoice: {
    table: 'Invoice',
    select: 'id, title, status, totalAmount, companyId, createdAt',
    label: (row) => {
      const title = row.title || 'Fatura'
      const status = row.status || 'Bilinmiyor'
      return `${title} • ${status}`
    },
    searchColumns: ['title'],
  },
  Contract: {
    table: 'Contract',
    select: 'id, title, status, type, companyId, createdAt',
    label: (row) => {
      const title = row.title || 'Sözleşme'
      const status = row.status || row.type || 'Bilinmiyor'
      return `${title} • ${status}`
    },
    searchColumns: ['title'],
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type') as ApprovalModule | null
    const search = searchParams.get('search')?.trim() ?? ''
    const limitParam = Number.parseInt(searchParams.get('limit') || '', 10)
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : DEFAULT_LIMIT
    const companyFilter = searchParams.get('companyId')

    if (!typeParam || !(typeParam in MODULE_CONFIG)) {
      return NextResponse.json({ error: 'Geçersiz modül tipi' }, { status: 400 })
    }

    const config = MODULE_CONFIG[typeParam]
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from(config.table)
      .select(config.select)
      .order(config.orderBy || 'createdAt', { ascending: false })
      .limit(limit)

    if (!isSuperAdmin || companyFilter) {
      const targetCompany = companyFilter ?? session.user.companyId
      if (!targetCompany) {
        return NextResponse.json([], { status: 200 })
      }
      query = query.eq('companyId', targetCompany)
    }

    if (search) {
      const pattern = `%${search}%`
      const ors = config.searchColumns.map((column) => `${column}.ilike.${pattern}`).join(',')
      query = query.or(ors)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const options =
      data?.map((row: any) => ({
        id: row.id,
        label: config.label(row),
        companyId: row.companyId,
      })) ?? []

    return NextResponse.json(options)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kayıt listesi alınamadı' },
      { status: 500 }
    )
  }
}





