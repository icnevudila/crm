import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import QuotePDF from '@/components/pdf/QuotePDF'

// Edge Runtime desteklemiyor, Node.js runtime kullan
// export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
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
            city
          )
        ),
        Company (
          id,
          name,
          city,
          sector
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
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePDF, { quote: quoteData }) as any
    )

    // PDF response döndür
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="teklif-${quoteData.id.substring(0, 8)}.pdf"`,
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

