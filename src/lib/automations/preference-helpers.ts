/**
 * User Automation Preference Helpers
 * Kullanıcı otomasyon tercihlerini yöneten helper fonksiyonlar
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export type AutomationPreference = 'ALWAYS' | 'ASK' | 'NEVER'

export interface UserAutomationPreference {
  id: string
  userId: string
  companyId: string
  emailOnDealCreated: AutomationPreference
  emailOnQuoteSent: AutomationPreference
  emailOnInvoiceCreated: AutomationPreference
  emailOnMeetingReminder: AutomationPreference
  smsOnDealCreated: AutomationPreference
  smsOnQuoteSent: AutomationPreference
  smsOnInvoiceCreated: AutomationPreference
  smsOnMeetingReminder: AutomationPreference
  whatsappOnDealCreated: AutomationPreference
  whatsappOnQuoteSent: AutomationPreference
  whatsappOnInvoiceCreated: AutomationPreference
  whatsappOnMeetingReminder: AutomationPreference
  createdAt: string
  updatedAt: string
}

/**
 * Kullanıcının otomasyon tercihini getir
 * Yoksa varsayılan tercihleri oluştur ve döndür
 */
export async function getUserAutomationPreference(
  userId: string,
  companyId: string
): Promise<UserAutomationPreference> {
  const supabase = getSupabaseWithServiceRole()

  // Mevcut tercihi getir
  const { data: existing } = await supabase
    .from('UserAutomationPreference')
    .select('*')
    .eq('userId', userId)
    .eq('companyId', companyId)
    .maybeSingle()

  if (existing) {
    return existing as UserAutomationPreference
  }

  // Yoksa varsayılan tercihleri oluştur
  const defaultPreference: Omit<UserAutomationPreference, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    companyId,
    emailOnDealCreated: 'ASK',
    emailOnQuoteSent: 'ASK',
    emailOnInvoiceCreated: 'ASK',
    emailOnMeetingReminder: 'ASK',
    smsOnDealCreated: 'NEVER',
    smsOnQuoteSent: 'NEVER',
    smsOnInvoiceCreated: 'NEVER',
    smsOnMeetingReminder: 'ASK',
    whatsappOnDealCreated: 'NEVER',
    whatsappOnQuoteSent: 'NEVER',
    whatsappOnInvoiceCreated: 'NEVER',
    whatsappOnMeetingReminder: 'NEVER',
  }

  const { data: created, error } = await supabase
    .from('UserAutomationPreference')
    .insert([defaultPreference])
    .select()
    .single()

  if (error) {
    console.error('Error creating user automation preference:', error)
    // Hata durumunda varsayılan tercihleri döndür
    return {
      id: '',
      ...defaultPreference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  return created as UserAutomationPreference
}

/**
 * Kullanıcının otomasyon tercihini güncelle
 */
export async function updateUserAutomationPreference(
  userId: string,
  companyId: string,
  updates: Partial<Omit<UserAutomationPreference, 'id' | 'userId' | 'companyId' | 'createdAt' | 'updatedAt'>>
): Promise<UserAutomationPreference | null> {
  const supabase = getSupabaseWithServiceRole()

  // Önce tercihi oluştur (yoksa)
  await getUserAutomationPreference(userId, companyId)

  // Güncelle
  const { data, error } = await supabase
    .from('UserAutomationPreference')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId)
    .eq('companyId', companyId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user automation preference:', error)
    return null
  }

  return data as UserAutomationPreference
}

/**
 * Belirli bir otomasyon için tercihi kontrol et
 */
export async function shouldSendAutomation(
  userId: string,
  companyId: string,
  automationType: 'emailOnDealCreated' | 'emailOnQuoteSent' | 'emailOnInvoiceCreated' | 'emailOnMeetingReminder' | 'smsOnDealCreated' | 'smsOnQuoteSent' | 'smsOnInvoiceCreated' | 'smsOnMeetingReminder' | 'whatsappOnDealCreated' | 'whatsappOnQuoteSent' | 'whatsappOnInvoiceCreated' | 'whatsappOnMeetingReminder'
): Promise<'ALWAYS' | 'ASK' | 'NEVER'> {
  const preference = await getUserAutomationPreference(userId, companyId)
  return preference[automationType] || 'ASK'
}



