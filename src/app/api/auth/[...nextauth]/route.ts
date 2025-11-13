import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextRequest } from 'next/server'

// Edge Runtime için uyumlu hale getir
export const runtime = 'nodejs' // NextAuth Edge Runtime'da sorun çıkarabilir, nodejs kullan

// NextAuth handler'ı oluştur
const handler = NextAuth(authOptions)

// Handler'ın tipini kontrol et - NextAuth v4 handler bir function döndürür
type NextAuthHandler = (req: any, res: any) => Promise<Response> | Response

// Next.js 15 App Router için request'i NextAuth'un beklediği formata dönüştür
async function handleAuthRequest(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) {
  try {
    const url = new URL(request.url)
    
    // Next.js 15'te params async olabilir, await et
    const params = await Promise.resolve(context.params)
    
    // Catch-all route'dan gelen parametreleri al
    // /api/auth/[...nextauth] -> params.nextauth = ['session'] veya ['callback', 'credentials']
    let nextauthSegments = params?.nextauth || []
    
    // Eğer nextauthSegments boşsa, URL'den çıkar
    if (!nextauthSegments || nextauthSegments.length === 0) {
      const pathname = url.pathname
      const segments = pathname.split('/').filter(Boolean)
      const authIndex = segments.indexOf('auth')
      if (authIndex >= 0 && authIndex < segments.length - 1) {
        nextauthSegments = segments.slice(authIndex + 1)
      }
    }
    
    // NextAuth'un beklediği format: { query: { nextauth: [...] } }
    // NextAuth v4 Pages Router formatını bekler
    // CRITICAL: query.nextauth mutlaka array olmalı ve undefined olmamalı
    const mockReq: any = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      query: {
        nextauth: Array.isArray(nextauthSegments) && nextauthSegments.length > 0 
          ? nextauthSegments 
          : [''],
      },
    }
    
    // POST request için body ekle
    if (request.method === 'POST') {
      try {
        mockReq.body = await request.text()
      } catch (e) {
        // Body okuma hatası - devam et
      }
    }

    // Mock res objesi oluştur - NextAuth v4 Pages Router formatını bekler
    const mockRes: any = {
      setHeader: () => {},
      getHeader: () => undefined,
      removeHeader: () => {},
      status: (code: number) => {
        mockRes.statusCode = code
        return mockRes
      },
      json: (data: any) => {
        mockRes._json = data
        return mockRes
      },
      send: (data: any) => {
        mockRes._body = data
        return mockRes
      },
      end: () => mockRes,
      statusCode: 200,
      _headers: {},
    }
    
    // NextAuth handler'ı çağır
    // NextAuth v4 handler'ı (req, res) formatında çalışır
    let response: any
    
    if (typeof handler === 'function') {
      // Handler direkt function ise çağır
      response = await handler(mockReq, mockRes)
    } else if (handler && typeof handler === 'object' && 'default' in handler) {
      // Handler default export ise
      response = await (handler as any).default(mockReq, mockRes)
    } else {
      // Handler direkt kullanılabilir
      response = await (handler as any)(mockReq, mockRes)
    }
    
    // Eğer mockRes'te response varsa onu kullan
    if (mockRes._json || mockRes._body) {
      return new Response(
        JSON.stringify(mockRes._json || mockRes._body),
        {
          status: mockRes.statusCode || 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Response kontrolü - NextAuth handler'ı Response objesi döndürmeli
    if (response && response instanceof Response) {
      return response
    }
    
    // Eğer response bir obje ise (status, headers, body içeriyorsa) Response'a dönüştür
    if (response && typeof response === 'object' && 'status' in response) {
      const headers = new Headers()
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers.set(key, value)
          } else if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, String(v)))
          }
        })
      }
      
      return new Response(
        response.body || JSON.stringify(response),
        {
          status: response.status || 200,
          headers: headers,
        }
      )
    }
    
    // Fallback: JSON response
    return new Response(
      JSON.stringify(response || { error: 'No response from NextAuth' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('[NextAuth] Request error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Authentication error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) {
  return handleAuthRequest(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> | { nextauth: string[] } }
) {
  return handleAuthRequest(request, context)
}

