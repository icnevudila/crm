import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Test endpoint - veritabanındaki kolon adlarını kontrol et
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Invoice tablosundaki kolonları kontrol et
    const { data: invoiceColumns, error: invoiceError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'Invoice' 
          AND column_name IN ('total', 'totalAmount', 'grandTotal')
          ORDER BY column_name;
        `
      })
      .catch(async () => {
        // RPC yoksa direkt query yap
        const { data: sampleInvoice } = await supabase
          .from('Invoice')
          .select('*')
          .limit(1)
          .single()
        
        return {
          data: sampleInvoice ? Object.keys(sampleInvoice).filter(k => ['total', 'totalAmount', 'grandTotal'].includes(k)).map(k => ({ column_name: k })) : [],
          error: null
        }
      })

    // Quote tablosundaki kolonları kontrol et
    const { data: quoteColumns, error: quoteError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'Quote' 
          AND column_name IN ('total', 'totalAmount', 'grandTotal')
          ORDER BY column_name;
        `
      })
      .catch(async () => {
        // RPC yoksa direkt query yap
        const { data: sampleQuote } = await supabase
          .from('Quote')
          .select('*')
          .limit(1)
          .single()
        
        return {
          data: sampleQuote ? Object.keys(sampleQuote).filter(k => ['total', 'totalAmount', 'grandTotal'].includes(k)).map(k => ({ column_name: k })) : [],
          error: null
        }
      })

    // Örnek veri çek
    const { data: sampleInvoice } = await supabase
      .from('Invoice')
      .select('*')
      .limit(1)
      .single()
      .catch(() => ({ data: null }))

    const { data: sampleQuote } = await supabase
      .from('Quote')
      .select('*')
      .limit(1)
      .single()
      .catch(() => ({ data: null }))

    return NextResponse.json({
      invoiceColumns: sampleInvoice ? Object.keys(sampleInvoice).filter(k => k.includes('total') || k.includes('Total') || k.includes('amount') || k.includes('Amount')) : [],
      quoteColumns: sampleQuote ? Object.keys(sampleQuote).filter(k => k.includes('total') || k.includes('Total') || k.includes('amount') || k.includes('Amount')) : [],
      sampleInvoice: sampleInvoice ? {
        id: sampleInvoice.id,
        total: sampleInvoice.total,
        totalAmount: sampleInvoice.totalAmount,
        grandTotal: sampleInvoice.grandTotal,
        status: sampleInvoice.status,
      } : null,
      sampleQuote: sampleQuote ? {
        id: sampleQuote.id,
        total: sampleQuote.total,
        totalAmount: sampleQuote.totalAmount,
        status: sampleQuote.status,
      } : null,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error?.message || 'Failed to check columns',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

