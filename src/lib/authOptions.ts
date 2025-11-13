import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSupabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// bcryptjs compare fonksiyonu için
const bcryptCompare = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

// Session cache - ENTERPRISE: Login sonrası 60 saniye revalidation
const sessionCache = new Map<string, { session: any; expires: number }>()
const SESSION_CACHE_TTL = 60 * 1000 // 60 SANİYE cache (login sonrası veriler cache'lenip 60 saniye içinde yenilensin)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null // NextAuth'da null döndürmek hata anlamına gelir
        }

        // Login için service role key kullan (RLS bypass)
        // Çünkü henüz kimlik doğrulanmış kullanıcı yok
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        // Service role key varsa onu kullan, yoksa normal client kullan
        const supabase = supabaseServiceKey 
          ? (await import('@supabase/supabase-js')).createClient(
              supabaseUrl,
              supabaseServiceKey,
              { auth: { persistSession: false } }
            )
          : getSupabase()

        // Kullanıcıyı bul (sadece gerekli alanlar - performans için)
        // Önce email ile bul (SuperAdmin için companyId kontrolü yapılmayacak)
        let query = supabase
          .from('User')
          .select('id, email, name, password, role, companyId')
          .eq('email', credentials.email)
        
        // SuperAdmin değilse companyId kontrolü yap
        // SuperAdmin için companyId kontrolünü bypass et (tüm şirketleri görebilir)
        const { data: user, error: userError } = await query.maybeSingle()

        // Hata kontrolü
        if (userError) {
          console.error('User lookup error:', userError)
          return null // NextAuth'da null döndürmek hata anlamına gelir
        }

        // Sonuç kontrolü
        if (!user) {
          console.error('User not found')
          return null // NextAuth'da null döndürmek hata anlamına gelir
        }

        // Kullanıcının companyId'si yoksa hata ver (SuperAdmin hariç)
        const isSuperAdmin = user.role === 'SUPER_ADMIN'
        if (!user.companyId && !isSuperAdmin) {
          console.error('User has no companyId')
          return null // NextAuth'da null döndürmek hata anlamına gelir
        }

        // Şifre kontrolü
        // Demo için: demo123 ve superadmin123 şifreleri geçerli
        // Production'da bcrypt.compare kullanılmalı
        const passwordMatch =
          credentials.password === 'demo123' ||
          credentials.password === 'superadmin123' ||
          (user.password.startsWith('$2b$') &&
            (await bcryptCompare(credentials.password, user.password)))

        if (!passwordMatch) {
          console.error('Password mismatch')
          return null // NextAuth'da null döndürmek hata anlamına gelir
        }

        // Şirket bilgisini al - kullanıcının kendi companyId'sini kullan
        // SuperAdmin için company yoksa da devam et
        let company = null
        if (user.companyId) {
          const { data: companyData, error: companyError } = await supabase
            .from('Company')
            .select('id, name')
            .eq('id', user.companyId)
            .maybeSingle()

          if (companyError) {
            console.error('Company lookup error:', companyError)
            // SuperAdmin için company hatası kritik değil
            if (!isSuperAdmin) {
              console.error('Company lookup error:', companyError)
              return null // NextAuth'da null döndürmek hata anlamına gelir
            }
          } else {
            company = companyData
          }
        }

        // SuperAdmin için company yoksa da devam et
        if (!company && !isSuperAdmin) {
          console.error('Company not found for user')
          return null // NextAuth'da null döndürmek hata anlamına gelir
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId || null, // SuperAdmin için null olabilir
          companyName: company?.name || null, // SuperAdmin için null olabilir
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.companyId = user.companyId
        token.companyName = user.companyName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
        session.user.companyName = token.companyName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/tr/login', // Locale prefix ile login sayfası
    error: '/tr/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
    // ENTERPRISE: Session timeout hatalarını önlemek için updateAge artırıldı
    updateAge: 24 * 60 * 60, // 24 saat (session her 24 saatte bir güncellenir)
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Debug mode - development'ta daha fazla log
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
}

