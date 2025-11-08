import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import SystemProposalPDF from '@/components/pdf/SystemProposalPDF'

// Node.js runtime kullan (Edge Runtime desteklemiyor)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SUPER_ADMIN ve ADMIN teklif oluşturabilir
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Company bilgilerini çek
    const { data: company } = await supabase
      .from('Company')
      .select('*')
      .eq('id', session.user.companyId)
      .single()

    // Proposal verisini hazırla
    const proposal = {
      id: body.id || `PROP-${Date.now()}`,
      title: body.title || 'CRM Enterprise V3 Sistem Teklifi',
      proposalNumber: body.proposalNumber,
      createdAt: body.createdAt || new Date().toISOString(),
      validUntil: body.validUntil,
      customer: body.customer,
      company: company || {
        name: 'CRM Enterprise V3',
        taxNumber: company?.taxNumber,
        address: company?.address,
        city: company?.city,
        phone: company?.phone,
        email: company?.email,
        website: company?.website,
      },
      packages: body.packages || [],
      modules: body.modules,
      totalAmount: body.totalAmount,
      discount: body.discount || 0,
      taxRate: body.taxRate || 18,
      notes: body.notes,
      terms: body.terms || [
        'Bu teklif 30 gün geçerlidir.',
        'Ödeme koşulları anlaşma ile belirlenir.',
        'Sistem kurulumu ve eğitim dahildir.',
        'Teknik destek 1 yıl ücretsizdir.',
        'Yazılım güncellemeleri dahildir.',
      ],
    }

    // PDF oluştur
    const pdfBuffer = await renderToBuffer(
      React.createElement(SystemProposalPDF, { proposal }) as any
    )

    // PDF response döndür
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sistem-teklifi-${proposal.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

