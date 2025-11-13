import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

function validateAuth(request: Request) {
  const header = request.headers.get('authorization') || request.headers.get('x-cron-key')
  const token = process.env.CRON_TASK_TOKEN
  if (!token) {
    throw new Error('Missing CRON_TASK_TOKEN environment variable')
  }
  if (!header) {
    return false
  }
  if (header.startsWith('Bearer ')) {
    return header.slice(7) === token
  }
  return header === token
}

function resolveBaseUrl() {
  const explicit = process.env.CRON_BASE_URL || process.env.INTERNAL_API_BASE_URL
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }
  const vercel = process.env.VERCEL_URL
  if (vercel) {
    return `https://${vercel}`
  }
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL
  if (publicUrl) {
    return publicUrl.replace(/\/$/, '')
  }
  throw new Error('CRON_BASE_URL (veya VERCEL_URL/NEXT_PUBLIC_APP_URL) tanımlı olmalı')
}

export async function POST(request: Request) {
  try {
    if (!validateAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = resolveBaseUrl()
    const token = process.env.CRON_TASK_TOKEN!
    const supabase = getSupabaseWithServiceRole()

    const { data: companies, error: companiesError } = await supabase
      .from('Company')
      .select('id')

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 500 })
    }

    const results: Array<{ companyId: string; ok: boolean; status: number }> = []

    for (const company of companies ?? []) {
      const response = await fetch(
        `${baseUrl}/api/analytics/kpis?cronToken=${token}&companyId=${company.id}&refresh=1`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      )

      results.push({
        companyId: company.id,
        ok: response.ok,
        status: response.status,
      })
    }

    // Global (super admin) cache
    const globalResponse = await fetch(
      `${baseUrl}/api/analytics/kpis?cronToken=${token}&companyId=global&global=1&refresh=1`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    )

    results.push({
      companyId: 'global',
      ok: globalResponse.ok,
      status: globalResponse.status,
    })

    const failures = results.filter((item) => !item.ok)

    return NextResponse.json({
      ok: failures.length === 0,
      total: results.length,
      failures,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to refresh KPI cache' },
      { status: 500 }
    )
  }
}




