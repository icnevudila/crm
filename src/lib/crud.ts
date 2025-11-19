/**
 * Ortak CRUD Servisleri
 * Tüm modüller için tekrar kullanılabilir CRUD işlemleri
 */

import { getSupabase, getSupabaseWithServiceRole } from './supabase'
import { logAction } from './logger'
import { getServerSession } from '@/lib/auth-supabase'

export interface CrudFilters {
  search?: string
  status?: string
  [key: string]: any
}

export interface CrudOptions {
  table: string
  filters?: CrudFilters
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  limit?: number
  select?: string // Supabase select syntax
}

// getSupabaseWithServiceRole artık supabase.ts içinde export edildi

/**
 * Kayıtları listele (GET)
 */
export async function getRecords(options: CrudOptions) {
  const session = await getServerSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // SuperAdmin kontrolü
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const companyId = session.user.companyId

  // Service role key ile RLS bypass (infinite recursion sorununu çözmek için)
  const supabase = getSupabaseWithServiceRole()
  const { table, filters = {}, orderBy = 'createdAt', orderDirection = 'desc', limit, select = '*' } = options

  // NOT: companyId kontrolü API seviyesinde yapılıyor (güvenlik)
  // Performans için: Sadece gerekli kolonları çek (varsayılan: tüm kolonlar)
  // ÖNEMLİ: Product tablosunda status kolonu yok - select = '*' kullanılırsa hata verir
  // Product tablosu için sadece temel kolonları seç
  const safeSelect = table === 'Product' && select === '*' 
    ? 'id, name, price, stock, companyId, createdAt, updatedAt'
    : select
  
  let query = supabase
    .from(table)
    .select(safeSelect)
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .limit(limit || 500) // Performans için limit (max 500 kayıt - daha hızlı)
  
  // SuperAdmin tüm şirketlerin verilerini görebilir, diğerleri sadece kendi şirketlerini
  if (!isSuperAdmin) {
    if (!companyId) {
      throw new Error('Unauthorized: Company ID required')
    }
    // MUTLAKA companyId filtresi uygula - multi-tenant güvenlik için kritik
    query = query.eq('companyId', companyId)
  }

  // Arama filtresi
  if (filters.search) {
    // İsim veya email alanlarında arama (tablo bazlı)
    if (table === 'Customer') {
      // Customer için: isim, email, telefon ile arama
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    } else if (table === 'Vendor') {
      // Vendor için: isim, email, telefon ile arama
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    } else if (table === 'Quote' || table === 'Invoice') {
      query = query.ilike('title', `%${filters.search}%`)
    } else if (table === 'Deal') {
      query = query.ilike('title', `%${filters.search}%`)
    } else if (table === 'Product') {
      query = query.ilike('name', `%${filters.search}%`)
    }
  }

  // Status filtresi (sadece status kolonu olan tablolar için - Product tablosunda status yok!)
  if (filters.status && table !== 'Product') {
    query = query.eq('status', filters.status)
  }

  // Sector filtresi (Customer için)
  if (filters.sector && table === 'Customer') {
    query = query.eq('sector', filters.sector)
  }

  // Diğer filtreler
  Object.keys(filters).forEach((key) => {
    if (key !== 'search' && key !== 'status' && key !== 'sector' && filters[key]) {
      query = query.eq(key, filters[key])
    }
  })

  // Limit
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error(`getRecords error for table ${table}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(error.message)
  }

  return data || []
}

/**
 * Tek kayıt getir (GET by ID)
 */
export async function getRecordById(table: string, id: string, select?: string) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

  let query = supabase
    .from(table)
    .select(select || '*')
    .eq('id', id)
  
  // Normal kullanıcılar için companyId filtresi
  if (!isSuperAdmin) {
    query = query.eq('companyId', session.user.companyId)
  }
  
  const { data, error } = await query.single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Yeni kayıt oluştur (POST)
 */
export async function createRecord(table: string, data: any, logDescription?: string) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()

  // companyId ve createdBy ekle (audit trail için)
  // Güvenlik: session.user.id yoksa NULL kullan (foreign key hatası önleme)
  // ÖNEMLİ: createdBy kolonu yoksa (migration çalıştırılmamışsa) hata vermemesi için
  const recordData: any = {
    ...data,
    companyId: session.user.companyId,
  }
  
  // createdBy kolonunu EKLEME - migration'da yok, hata veriyor
  // NOT: createdBy kolonu migration'da yoksa hata verir, bu yüzden kaldırıldı

  // @ts-ignore - Supabase type inference issue with dynamic table names
  let { data: created, error } = await (supabase
    .from(table) as any)
    .insert(recordData)
    .select()
    .single()

  // Eğer createdBy kolonu hatası varsa (PGRST204), createdBy olmadan tekrar dene
  if (error && (error.code === 'PGRST204' || error.message?.includes('createdBy'))) {
    console.warn(`createRecord: createdBy kolonu bulunamadı, createdBy olmadan tekrar deneniyor...`)
    const { createdBy, ...recordDataWithoutCreatedBy } = recordData
    const retryResult = await (supabase
      .from(table) as any)
      .insert(recordDataWithoutCreatedBy)
      .select()
      .single()
    created = retryResult.data
    error = retryResult.error
  }

  if (error) {
    console.error(`createRecord error for table ${table}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(error.message)
  }

  // ActivityLog kaydı KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
  // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)

  return created
}

/**
 * Kayıt güncelle (PUT)
 * NOT: Bu fonksiyon tüm body'yi gönderir - schema-extension kolonları göndermemek için endpoint'lerde filtreleme yapılmalı
 */
export async function updateRecord(
  table: string,
  id: string,
  data: any,
  logDescription?: string
) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()

  // updatedAt ve updatedBy ekle (audit trail için)
  // NOT: data zaten endpoint'lerde filtrelenmiş olmalı (sadece schema.sql kolonları)
  // Güvenlik: session.user.id yoksa NULL kullan (foreign key hatası önleme)
  // ÖNEMLİ: updatedBy kolonu yoksa (migration çalıştırılmamışsa) hata vermemesi için
  const updateData: any = {
    ...data,
    updatedAt: new Date().toISOString(),
  }
  
  // updatedBy kolonunu EKLEME - migration'da yok, hata veriyor
  // NOT: updatedBy kolonu migration'da yoksa hata verir, bu yüzden kaldırıldı

  // SuperAdmin kontrolü
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

  // Update işlemi - SuperAdmin için companyId filtresi yok
  let updateQuery = (supabase
    .from(table) as any)
    .update(updateData)
    .eq('id', id)
  
  if (!isSuperAdmin) {
    updateQuery = updateQuery.eq('companyId', session.user.companyId)
  }
  
  let { error: updateError } = await updateQuery

  // Eğer updatedBy kolonu hatası varsa (PGRST204), updatedBy olmadan tekrar dene
  if (updateError && (updateError.code === 'PGRST204' || updateError.message?.includes('updatedBy'))) {
    console.warn(`updateRecord: updatedBy kolonu bulunamadı, updatedBy olmadan tekrar deneniyor...`)
    const { updatedBy, ...updateDataWithoutUpdatedBy } = updateData
    let retryUpdateQuery = (supabase
      .from(table) as any)
      .update(updateDataWithoutUpdatedBy)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      retryUpdateQuery = retryUpdateQuery.eq('companyId', session.user.companyId)
    }
    
    const retryResult = await retryUpdateQuery
    updateError = retryResult.error
  }

  if (updateError) {
    throw new Error(updateError.message)
  }
  
  // Update başarılı - güncellenmiş veriyi çek (SuperAdmin için companyId filtresi yok)
  let selectQuery = supabase
    .from(table)
    .select('*')
    .eq('id', id)
  
  if (!isSuperAdmin) {
    selectQuery = selectQuery.eq('companyId', session.user.companyId)
  }
  
  const { data: updated, error: selectError } = await selectQuery.single()

  if (selectError) {
    throw new Error(selectError.message || 'Güncellenmiş kayıt bulunamadı')
  }

  // ActivityLog kaydı
  await logAction({
    entity: table,
    action: 'UPDATE',
    description: logDescription || `${table} kaydı güncellendi: ${id}`,
    meta: { entity: table, action: 'update', id, ...data },
    userId: session.user.id,
    companyId: session.user.companyId,
  })

  return updated
}

/**
 * Kayıt sil (DELETE)
 */
export async function deleteRecord(table: string, id: string, logDescription?: string) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()

  // Silinmeden önce kaydı al (log için)
  const { data: record } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .eq('companyId', session.user.companyId)
    .single()

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('companyId', session.user.companyId)

  if (error) {
    throw new Error(error.message)
  }

  // ActivityLog kaydı
  if (record) {
    await logAction({
      entity: table,
      action: 'DELETE',
      description: logDescription || `${table} kaydı silindi: ${id}`,
      meta: { entity: table, action: 'delete', id, deletedRecord: record },
      userId: session.user.id,
      companyId: session.user.companyId,
    })
  }

  return { success: true }
}





