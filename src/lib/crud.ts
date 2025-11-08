/**
 * Ortak CRUD Servisleri
 * Tüm modüller için tekrar kullanılabilir CRUD işlemleri
 */

import { getSupabase, getSupabaseWithServiceRole } from './supabase'
import { logAction } from './logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // SuperAdmin tüm şirketlerin verilerini görebilir
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const companyId = session.user.companyId

  // Service role key ile RLS bypass (infinite recursion sorununu çözmek için)
  const supabase = getSupabaseWithServiceRole()
  const { table, filters = {}, orderBy = 'createdAt', orderDirection = 'desc', limit, select = '*' } = options

  // NOT: companyId kontrolü API seviyesinde yapılıyor (güvenlik)
  // Performans için: Sadece gerekli kolonları çek (varsayılan: tüm kolonlar)
  let query = supabase
    .from(table)
    .select(select)
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .limit(limit || 500) // Performans için limit (max 500 kayıt - daha hızlı)
  
  // SuperAdmin değilse companyId filtresi ekle
  if (!isSuperAdmin) {
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()

  let query = supabase
    .from(table)
    .select(select || '*')
    .eq('id', id)
    .eq('companyId', session.user.companyId)
    .single()

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Yeni kayıt oluştur (POST)
 */
export async function createRecord(table: string, data: any, logDescription?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()

  // companyId ekle
  const recordData = {
    ...data,
    companyId: session.user.companyId,
  }

  // @ts-ignore - Supabase type inference issue with dynamic table names
  const { data: created, error } = await (supabase
    .from(table) as any)
    .insert(recordData)
    .select()
    .single()

  if (error) {
    console.error(`createRecord error for table ${table}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(error.message)
  }

  // ActivityLog kaydı
  await logAction({
    entity: table,
    action: 'CREATE',
    description: logDescription || `${table} kaydı oluşturuldu: ${(created as any)?.id || 'unknown'}`,
    meta: { entity: table, action: 'create', id: (created as any)?.id || 'unknown', ...data },
    userId: session.user.id,
    companyId: session.user.companyId,
  })

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }

  // Service role key ile RLS bypass
  const supabase = getSupabaseWithServiceRole()

  // updatedAt ekle
  // NOT: data zaten endpoint'lerde filtrelenmiş olmalı (sadece schema.sql kolonları)
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // @ts-ignore - Supabase type inference issue with dynamic table names
  const { data: updated, error } = await (supabase
    .from(table) as any)
    .update(updateData)
    .eq('id', id)
    .eq('companyId', session.user.companyId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
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
  const session = await getServerSession(authOptions)
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





