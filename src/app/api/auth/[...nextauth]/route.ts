import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Edge Runtime için uyumlu hale getir
export const runtime = 'nodejs' // NextAuth Edge Runtime'da sorun çıkarabilir, nodejs kullan

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

