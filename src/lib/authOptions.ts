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
        companyId: { label: 'Company ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.companyId) {
          throw new Error('Email, password ve company ID gereklidir')
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
          throw new Error(`Kullanıcı bulunamadı: ${userError.message}`)
        }

        // Sonuç kontrolü
        if (!user) {
          throw new Error('Kullanıcı bulunamadı. Email veya şirket bilgisi hatalı olabilir.')
        }

        // SuperAdmin değilse companyId kontrolü yap
        if (user.role !== 'SUPER_ADMIN' && user.companyId !== credentials.companyId) {
          throw new Error('Kullanıcı bulunamadı. Email veya şirket bilgisi hatalı olabilir.')
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
          throw new Error('Şifre hatalı')
        }

        // Şirket bilgisini al (SuperAdmin için kendi companyId'sini kullan)
        // SuperAdmin için seçilen companyId yerine kendi companyId'sini kullan
        const targetCompanyId = user.role === 'SUPER_ADMIN' ? user.companyId : credentials.companyId
        
        // SuperAdmin için company lookup'ı bypass et - kendi companyId'sini kullan
        let company
        if (user.role === 'SUPER_ADMIN') {
          // SuperAdmin için kendi companyId'sini kullan
          const { data: superAdminCompany, error: companyError } = await supabase
            .from('Company')
            .select('id, name')
            .eq('id', user.companyId)
            .maybeSingle()

          if (companyError) {
            console.error('Company lookup error:', companyError)
            throw new Error(`Şirket bulunamadı: ${companyError.message}`)
          }

          if (!superAdminCompany) {
            // SuperAdmin için varsayılan company oluştur
            const { data: newCompany, error: createError } = await supabase
              .from('Company')
              .insert([
                {
                  name: 'CRM System',
                  sector: 'Sistem',
                  city: 'İstanbul',
                  status: 'ACTIVE',
                },
              ])
              .select('id, name')
              .single()

            if (createError) {
              console.error('Company creation error:', createError)
              throw new Error(`Şirket oluşturulamadı: ${createError.message}`)
            }

            company = newCompany
          } else {
            company = superAdminCompany
          }
        } else {
          // Normal kullanıcı için seçilen companyId'yi kullan
          const { data: normalCompany, error: companyError } = await supabase
            .from('Company')
            .select('id, name')
            .eq('id', credentials.companyId)
            .maybeSingle()

          if (companyError) {
            console.error('Company lookup error:', companyError)
            throw new Error(`Şirket bulunamadı: ${companyError.message}`)
          }

          if (!normalCompany) {
            throw new Error('Şirket bulunamadı. Lütfen şirket seçimini kontrol edin.')
          }

          company = normalCompany
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId, // Her zaman kullanıcının kendi companyId'si
          companyName: company.name,
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
    signIn: '/login',
    error: '/login',
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
  // NextAuth URL - CLIENT_FETCH_ERROR'u önlemek için
  trustHost: true, // Development'ta localhost için
  useSecureCookies: process.env.NODE_ENV === 'production',
}

