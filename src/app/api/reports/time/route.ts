import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Şimdilik boş veri döndür - yakında eklenecek
    return NextResponse.json(
      {
        timeBased: [],
      },
      {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    )
  } catch (error: any) {
    console.error('Error fetching time-based reports:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time-based reports' },
      { status: 500 }
    )
  }
}



