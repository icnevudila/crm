import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test push notification gönder
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        payload: {
          title: 'Test Bildirimi',
          message: 'Bu bir test push notification\'dır. Sistem çalışıyor! 🎉',
          type: 'success',
          priority: 'normal',
          url: '/dashboard',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || 'Test push notification gönderilemedi' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Test push notification error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to send test push notification' },
      { status: 500 }
    )
  }
}


import { getSafeSession } from '@/lib/safe-session'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test push notification gönder
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        payload: {
          title: 'Test Bildirimi',
          message: 'Bu bir test push notification\'dır. Sistem çalışıyor! 🎉',
          type: 'success',
          priority: 'normal',
          url: '/dashboard',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || 'Test push notification gönderilemedi' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Test push notification error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to send test push notification' },
      { status: 500 }
    )
  }
}

