import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import QuoteRecordPDF from '@/components/pdf/QuoteRecordPDF'

// Edge Runtime desteklemiyor, Node.js runtime kullan
// export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Quote'u ilişkilerle birlikte çek
    const { data: quote, error } = await supabase
      .from('Quote')
      .select(
        `
        *,
        Deal (
          id,
          title,
          Customer (
            id,
            name,
            email,
            phone,
            city,
            address,
            CustomerCompany:customerCompanyId (
              id,
              name,
              address,
              city
            )
          )
        ),
        Company:companyId (
          id,
          name,
          city,
          address,
          phone,
          email
        )
      `
      )
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    const quoteData = quote as any

    // PDF oluştur
    const QuoteRecordPDFComponent = QuoteRecordPDF as React.ComponentType<{ quote: any }>
    const pdfElement = React.createElement(QuoteRecordPDFComponent, { quote: quoteData })
    const pdfBuffer = await renderToBuffer(pdfElement)

    // PDF response döndür
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kayit_ozeti_${quoteData.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

