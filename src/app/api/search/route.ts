import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getSafeSession } from '@/lib/auth'

/**
 * Global Search API - Tüm modüllerde arama
 * 
 * GET /api/search?q=abc
 * 
 * Sonuçlar:
 * - Customers
 * - Deals
 * - Quotes
 * - Invoices
 * - Products
 * - Tasks
 * - Meetings
 */
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (query.length < 2) {
      return NextResponse.json({ results: [], total: 0 })
    }
    
    const supabase = getSupabase()
    const companyId = session.user.companyId
    const searchTerm = `%${query.toLowerCase()}%`
    
    const results: Array<{
      id: string
      type: string
      title: string
      subtitle?: string
      url: string
    }> = []
    
    // 1. Customers
    const { data: customers } = await supabase
      .from('Customer')
      .select('id, name, email, phone, companyId')
      .eq('companyId', companyId)
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .limit(5)
    
    if (customers) {
      customers.forEach((customer) => {
        results.push({
          id: customer.id,
          type: 'customer',
          title: customer.name || 'İsimsiz Müşteri',
          subtitle: customer.email || customer.phone || undefined,
          url: `/tr/customers/${customer.id}`,
        })
      })
    }
    
    // 2. Deals
    const { data: deals } = await supabase
      .from('Deal')
      .select('id, title, stage, value, companyId')
      .eq('companyId', companyId)
      .ilike('title', searchTerm)
      .limit(5)
    
    if (deals) {
      deals.forEach((deal) => {
        results.push({
          id: deal.id,
          type: 'deal',
          title: deal.title || 'İsimsiz Fırsat',
          subtitle: deal.stage ? `Aşama: ${deal.stage}` : undefined,
          url: `/tr/deals/${deal.id}`,
        })
      })
    }
    
    // 3. Quotes
    const { data: quotes } = await supabase
      .from('Quote')
      .select('id, quoteNumber, title, status, companyId')
      .eq('companyId', companyId)
      .or(`quoteNumber.ilike.${searchTerm},title.ilike.${searchTerm}`)
      .limit(5)
    
    if (quotes) {
      quotes.forEach((quote) => {
        results.push({
          id: quote.id,
          type: 'quote',
          title: quote.title || quote.quoteNumber || 'İsimsiz Teklif',
          subtitle: quote.quoteNumber || quote.status || undefined,
          url: `/tr/quotes/${quote.id}`,
        })
      })
    }
    
    // 4. Invoices
    const { data: invoices } = await supabase
      .from('Invoice')
      .select('id, invoiceNumber, title, status, companyId')
      .eq('companyId', companyId)
      .or(`invoiceNumber.ilike.${searchTerm},title.ilike.${searchTerm}`)
      .limit(5)
    
    if (invoices) {
      invoices.forEach((invoice) => {
        results.push({
          id: invoice.id,
          type: 'invoice',
          title: invoice.title || invoice.invoiceNumber || 'İsimsiz Fatura',
          subtitle: invoice.invoiceNumber || invoice.status || undefined,
          url: `/tr/invoices/${invoice.id}`,
        })
      })
    }
    
    // 5. Products
    const { data: products } = await supabase
      .from('Product')
      .select('id, name, sku, companyId')
      .eq('companyId', companyId)
      .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
      .limit(5)
    
    if (products) {
      products.forEach((product) => {
        results.push({
          id: product.id,
          type: 'product',
          title: product.name || 'İsimsiz Ürün',
          subtitle: product.sku || undefined,
          url: `/tr/products/${product.id}`,
        })
      })
    }
    
    // 6. Tasks
    const { data: tasks } = await supabase
      .from('Task')
      .select('id, title, status, dueDate, companyId')
      .eq('companyId', companyId)
      .ilike('title', searchTerm)
      .limit(5)
    
    if (tasks) {
      tasks.forEach((task) => {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title || 'İsimsiz Görev',
          subtitle: task.status || undefined,
          url: `/tr/tasks/${task.id}`,
        })
      })
    }
    
    // 7. Meetings
    const { data: meetings } = await supabase
      .from('Meeting')
      .select('id, title, meetingDate, status, companyId')
      .eq('companyId', companyId)
      .ilike('title', searchTerm)
      .limit(5)
    
    if (meetings) {
      meetings.forEach((meeting) => {
        results.push({
          id: meeting.id,
          type: 'meeting',
          title: meeting.title || 'İsimsiz Görüşme',
          subtitle: meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('tr-TR') : undefined,
          url: `/tr/meetings/${meeting.id}`,
        })
      })
    }
    
    // İlk 10 sonucu döndür (öncelik sırasına göre)
    const limitedResults = results.slice(0, 10)
    
    return NextResponse.json({
      results: limitedResults,
      total: results.length,
    })
  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Arama sırasında bir hata oluştu', message: error?.message },
      { status: 500 }
    )
  }
}
