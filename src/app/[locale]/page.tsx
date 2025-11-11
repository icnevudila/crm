export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { redirect } from 'next/navigation'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  // Locale'li ana sayfadan dashboard'a yönlendir
  const { locale } = await params
  redirect(`/${locale || 'tr'}/dashboard`)
}

