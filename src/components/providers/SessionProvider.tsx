'use client'

// Supabase Auth ile basit SessionProvider - NextAuth yerine kullan
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Artık NextAuth'a ihtiyaç yok - useSession hook'u direkt /api/auth/session'ı çağırıyor
  return <>{children}</>
}







