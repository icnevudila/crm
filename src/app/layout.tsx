import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Font optimization - display swap ve preload
const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap', // Font loading'i bloklamaz
  preload: true, // Font'u preload et
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'CRM Enterprise V3',
    template: '%s | CRM Enterprise V3',
  },
  description: 'Premium, hızlı ve optimize CRM sistemi - Next.js 15, Supabase, TypeScript ile geliştirilmiş kurumsal çözüm',
  keywords: ['CRM', 'Enterprise', 'Customer Relationship Management', 'Next.js', 'Supabase'],
  authors: [{ name: 'CRM Enterprise Team' }],
  creator: 'CRM Enterprise Team',
  publisher: 'CRM Enterprise Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: '/',
    title: 'CRM Enterprise V3',
    description: 'Premium, hızlı ve optimize CRM sistemi',
    siteName: 'CRM Enterprise V3',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM Enterprise V3',
    description: 'Premium, hızlı ve optimize CRM sistemi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        {/* Resource hints - DNS prefetch ve preconnect (instant navigation için) */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body className={inter.variable}>{children}</body>
    </html>
  )
}
