import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import KullanimKilavuzuPDF from '@/components/pdf/KullanimKilavuzuPDF'

// Edge Runtime desteklemiyor, Node.js runtime kullan
// export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // PDF oluştur
    const pdfBuffer = await renderToBuffer(
      React.createElement(KullanimKilavuzuPDF, { 
        companyName: (session.user as any)?.companyName || 'CRM Enterprise V3' 
      }) as any
    )

    // PDF response döndür
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CRM-Kullanim-Kilavuzu-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}


















