import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - her zaman fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Benzer müşterileri bul (Data Deduplication)
 * 
 * Algoritma:
 * 1. İsim benzerliği (Levenshtein distance)
 * 2. Email eşleşmesi
 * 3. Telefon eşleşmesi
 */
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Tüm müşterileri çek (sadece gerekli alanlar)
    let query = supabase
      .from('Customer')
      .select('id, name, email, phone, city, sector, status, createdAt, companyId')
      .order('createdAt', { ascending: false })

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: customers, error } = await query

    if (error) {
      console.error('Duplicates API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ duplicates: [] })
    }

    // Duplicate detection algoritması
    const duplicates: Array<{
      group: number
      customers: Array<{
        id: string
        name: string
        email?: string
        phone?: string
        city?: string
        sector?: string
        similarity: number
        matchReason: string
      }>
    }> = []

    const processed = new Set<string>()
    let groupId = 1

    // Normalize string fonksiyonu (Türkçe karakter desteği)
    const normalize = (str: string | null | undefined): string => {
      if (!str) return ''
      return str
        .toLowerCase()
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '')
    }

    // Levenshtein distance (basitleştirilmiş - karakter bazlı benzerlik)
    const similarity = (str1: string, str2: string): number => {
      const s1 = normalize(str1)
      const s2 = normalize(str2)
      
      if (s1 === s2) return 100
      if (s1.length === 0 || s2.length === 0) return 0
      
      // Basit benzerlik hesaplama (substring match)
      const longer = s1.length > s2.length ? s1 : s2
      const shorter = s1.length > s2.length ? s2 : s1
      
      if (longer.includes(shorter)) {
        return Math.round((shorter.length / longer.length) * 100)
      }
      
      // Karakter bazlı benzerlik
      let matches = 0
      const minLength = Math.min(s1.length, s2.length)
      for (let i = 0; i < minLength; i++) {
        if (s1[i] === s2[i]) matches++
      }
      
      return Math.round((matches / Math.max(s1.length, s2.length)) * 100)
    }

    // Telefon normalizasyonu (sadece rakamlar)
    const normalizePhone = (phone: string | null | undefined): string => {
      if (!phone) return ''
      return phone.replace(/\D/g, '')
    }

    // Her müşteri için diğer müşterilerle karşılaştır
    for (let i = 0; i < customers.length; i++) {
      const customer1 = customers[i]
      
      if (processed.has(customer1.id)) continue

      const group: Array<{
        id: string
        name: string
        email?: string
        phone?: string
        city?: string
        sector?: string
        similarity: number
        matchReason: string
      }> = [
        {
          id: customer1.id,
          name: customer1.name,
          email: customer1.email || undefined,
          phone: customer1.phone || undefined,
          city: customer1.city || undefined,
          sector: customer1.sector || undefined,
          similarity: 100,
          matchReason: 'Ana kayıt',
        },
      ]

      for (let j = i + 1; j < customers.length; j++) {
        const customer2 = customers[j]
        
        if (processed.has(customer2.id)) continue

        let matchFound = false
        let matchReason = ''
        let similarityScore = 0

        // 1. Email eşleşmesi (en güvenilir)
        if (customer1.email && customer2.email) {
          const email1 = normalize(customer1.email)
          const email2 = normalize(customer2.email)
          if (email1 === email2 && email1 !== '') {
            matchFound = true
            matchReason = 'Email eşleşmesi'
            similarityScore = 100
          }
        }

        // 2. Telefon eşleşmesi
        if (!matchFound && customer1.phone && customer2.phone) {
          const phone1 = normalizePhone(customer1.phone)
          const phone2 = normalizePhone(customer2.phone)
          if (phone1 === phone2 && phone1.length >= 10) {
            matchFound = true
            matchReason = 'Telefon eşleşmesi'
            similarityScore = 100
          }
        }

        // 3. İsim benzerliği (%80+ benzerlik)
        if (!matchFound && customer1.name && customer2.name) {
          const nameSimilarity = similarity(customer1.name, customer2.name)
          if (nameSimilarity >= 80) {
            matchFound = true
            matchReason = `İsim benzerliği (%${nameSimilarity})`
            similarityScore = nameSimilarity
          }
        }

        // 4. İsim + Email kombinasyonu (daha düşük benzerlik)
        if (!matchFound && customer1.name && customer2.name && customer1.email && customer2.email) {
          const nameSim = similarity(customer1.name, customer2.name)
          const email1 = normalize(customer1.email)
          const email2 = normalize(customer2.email)
          
          if (nameSim >= 60 && email1.includes('@') && email2.includes('@')) {
            const emailDomain1 = email1.split('@')[1]
            const emailDomain2 = email2.split('@')[1]
            
            if (emailDomain1 === emailDomain2) {
              matchFound = true
              matchReason = `İsim benzerliği (%${nameSim}) + Aynı email domain`
              similarityScore = Math.round((nameSim + 30) / 2) // Ortalama
            }
          }
        }

        if (matchFound) {
          group.push({
            id: customer2.id,
            name: customer2.name,
            email: customer2.email || undefined,
            phone: customer2.phone || undefined,
            city: customer2.city || undefined,
            sector: customer2.sector || undefined,
            similarity: similarityScore,
            matchReason,
          })
          processed.add(customer2.id)
        }
      }

      // Eğer grup içinde 2+ müşteri varsa duplicate olarak işaretle
      if (group.length >= 2) {
        duplicates.push({
          group: groupId++,
          customers: group.sort((a, b) => b.similarity - a.similarity), // En yüksek benzerlik önce
        })
        processed.add(customer1.id)
      }
    }

    return NextResponse.json({
      duplicates,
      totalDuplicates: duplicates.length,
      totalCustomers: customers.length,
    })
  } catch (error: any) {
    console.error('Duplicates API exception:', error)
    return NextResponse.json(
      { error: 'Failed to find duplicates', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}


