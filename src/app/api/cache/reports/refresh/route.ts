import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import {
  computeCustomerReport,
  computeDealReport,
  computeFinancialReport,
  computeInvoiceReport,
  computeProductReport,
  computeQuoteReport,
  computeSalesReport,
} from '@/lib/reports/compute'
import { getCacheScope, setReportCache } from '@/lib/cache/report-cache'

const REPORT_TYPES = {
  sales: computeSalesReport,
  customers: computeCustomerReport,
  deals: computeDealReport,
  quotes: computeQuoteReport,
  invoices: computeInvoiceReport,
  products: computeProductReport,
  financial: computeFinancialReport,
} as const

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

export async function POST(request: Request) {
  try {
    if (!validateAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { data: companies, error: companiesError } = await supabase
      .from('Company')
      .select('id')

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 500 })
    }

    let totalJobs = 0
    const errors: Array<{ companyId: string; reportType: string; message: string }> = []

    for (const company of companies ?? []) {
      const companyId = company.id
      const scope = getCacheScope(false, companyId)

      for (const [reportType, computeFn] of Object.entries(REPORT_TYPES)) {
        try {
          const payload = await computeFn({
            supabase,
            companyId,
            isSuperAdmin: false,
          })

          await setReportCache({
            supabase,
            reportType,
            scope,
            payload,
          })

          totalJobs += 1
        } catch (error: any) {
          errors.push({
            companyId,
            reportType,
            message: error?.message || 'Unknown error',
          })
        }
      }
    }

    // Global cache (SuperAdmin)
    for (const [reportType, computeFn] of Object.entries(REPORT_TYPES)) {
      try {
        const payload = await computeFn({
          supabase,
          companyId: 'global',
          isSuperAdmin: true,
        })

        await setReportCache({
          supabase,
          reportType,
          scope: { isGlobal: true },
          payload,
        })

        totalJobs += 1
      } catch (error: any) {
        errors.push({
          companyId: 'global',
          reportType,
          message: error?.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      ok: errors.length === 0,
      totalJobs,
      errors,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to refresh report cache' },
      { status: 500 }
    )
  }
}




