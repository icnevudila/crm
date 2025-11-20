/**
 * AI Komut Sistemi
 * Kullanıcı doğal dilde komut verir, AI işlemleri yapar
 */

export interface AICommand {
  type: 'create' | 'read' | 'update' | 'delete' | 'summarize' | 'generate' | 'help' | 'list' | 'show' | 'filter' | 'check' | 'analyze' | 'monitor' | 'trigger'
  entity: 'customer' | 'deal' | 'quote' | 'invoice' | 'task' | 'ticket' | 'note' | 'email' | 'product' | 'finance' | 'shipment' | 'meeting' | 'document' | 'contract' | 'automation' | 'activity' | 'notification' | 'analytics' | 'system' | 'report'
  action?: string
  params?: Record<string, any>
  rawCommand: string
  confidence?: number
}

/**
 * Komut örnekleri ve açıklamaları
 */
export const COMMAND_EXAMPLES = {
  tr: [
    // CREATE
    { command: 'Yeni müşteri ekle: ABC Şirketi', description: 'Müşteri oluştur' },
    { command: 'Fırsat oluştur: 50000 TL', description: 'Fırsat oluştur' },
    { command: 'Görev oluştur: Müşteri takibi', description: 'Görev oluştur' },
    { command: 'Ürün ekle: Laptop 5000 TL', description: 'Ürün oluştur' },
    { command: 'Görüşme planla: Yarın saat 14:00', description: 'Görüşme oluştur' },
    // READ/LIST
    { command: 'Müşterileri listele', description: 'Tüm müşterileri göster' },
    { command: 'Aktif müşterileri göster', description: 'Aktif müşterileri filtrele' },
    { command: 'Fırsatları listele', description: 'Tüm fırsatları göster' },
    { command: 'Kazanılan fırsatları göster', description: 'WON stage fırsatları' },
    { command: 'Bekleyen görevleri listele', description: 'PENDING görevler' },
    { command: 'Bugünkü görüşmeleri göster', description: 'Bugünkü görüşmeler' },
    { command: 'Faturaları listele', description: 'Tüm faturaları göster' },
    { command: 'Teklifleri listele', description: 'Tüm teklifleri göster' },
    { command: 'Sevkiyatları listele', description: 'Tüm sevkiyatları göster' },
    { command: 'Finans kayıtlarını listele', description: 'Tüm finans kayıtlarını göster' },
    // UPDATE
    { command: 'Fırsat durumunu değiştir: WON', description: 'Fırsat stage güncelle' },
    { command: 'Görev tamamlandı olarak işaretle', description: 'Görev status güncelle' },
    // DELETE
    { command: 'Müşteri sil: ABC Şirketi', description: 'Müşteri sil' },
    { command: 'Fırsat sil: Proje X', description: 'Fırsat sil' },
    // ANALYTICS & MONITORING
    { command: 'Dashboard KPI\'larını göster', description: 'Dashboard istatistiklerini göster' },
    { command: 'Aktif otomasyonları kontrol et', description: 'Çalışan otomasyonları listele' },
    { command: 'Son aktiviteleri göster', description: 'Son ActivityLog kayıtlarını göster' },
    { command: 'Bildirimleri kontrol et', description: 'Okunmamış bildirimleri göster' },
    { command: 'Sistem durumunu kontrol et', description: 'Veritabanı ve trigger durumlarını göster' },
    { command: 'Otomasyon geçmişini göster', description: 'Son çalışan otomasyonları göster' },
  ],
  en: [
    // CREATE
    { command: 'Create customer: ABC Company', description: 'Create customer' },
    { command: 'Create deal: 50000 TL', description: 'Create deal' },
    { command: 'Create task: Follow-up', description: 'Create task' },
    { command: 'Add product: Laptop 5000 TL', description: 'Create product' },
    { command: 'Schedule meeting: Tomorrow 2 PM', description: 'Create meeting' },
    // READ/LIST
    { command: 'List customers', description: 'Show all customers' },
    { command: 'Show active customers', description: 'Filter active customers' },
    { command: 'List deals', description: 'Show all deals' },
    { command: 'Show won deals', description: 'WON stage deals' },
    { command: 'List pending tasks', description: 'PENDING tasks' },
    { command: 'Show today meetings', description: 'Today meetings' },
    { command: 'List invoices', description: 'Show all invoices' },
    { command: 'List quotes', description: 'Show all quotes' },
    { command: 'List shipments', description: 'Show all shipments' },
    { command: 'List finance records', description: 'Show all finance records' },
    // UPDATE
    { command: 'Change deal status: WON', description: 'Update deal stage' },
    { command: 'Mark task as completed', description: 'Update task status' },
    // DELETE
    { command: 'Delete customer: ABC Company', description: 'Delete customer' },
    { command: 'Delete deal: Project X', description: 'Delete deal' },
    // ANALYTICS & MONITORING
    { command: 'Show dashboard KPIs', description: 'Show dashboard statistics' },
    { command: 'Check active automations', description: 'List running automations' },
    { command: 'Show recent activities', description: 'Show recent ActivityLog records' },
    { command: 'Check notifications', description: 'Show unread notifications' },
    { command: 'Check system status', description: 'Show database and trigger statuses' },
    { command: 'Show automation history', description: 'Show recently executed automations' },
  ],
}

/**
 * Komut tipleri ve pattern'leri
 */
export const COMMAND_PATTERNS = {
  create: {
    customer: /(yeni|oluştur|ekle).*müşteri|create.*customer|add.*customer/i,
    deal: /(yeni|oluştur|ekle).*fırsat|create.*deal|add.*deal/i,
    quote: /(yeni|oluştur|ekle).*teklif|create.*quote|add.*quote/i,
    invoice: /(yeni|oluştur|ekle).*fatura|create.*invoice|add.*invoice/i,
    task: /(yeni|oluştur|ekle).*görev|create.*task|add.*task/i,
    ticket: /(yeni|oluştur|ekle).*destek|create.*ticket|add.*ticket/i,
  },
  summarize: {
    note: /(özetle|summarize).*not/i,
    customer: /(özetle|summarize).*müşteri/i,
  },
  generate: {
    quote: /(oluştur|generate).*teklif.*metni/i,
    email: /(oluştur|generate|öner).*e.?posta|email.*response/i,
  },
}

/**
 * Komut parse etme - AI'ya gönderilecek prompt
 */
export function parseCommandPrompt(userInput: string, locale: 'tr' | 'en' = 'tr'): string {
  const isTurkish = locale === 'tr'

  return isTurkish
    ? `Komut: "${userInput}"

JSON döndür:
{
  "type": "create" | "read" | "list" | "show" | "update" | "delete" | "filter" | "summarize" | "generate" | "help" | "check" | "monitor" | "analyze" | "trigger",
  "entity": "customer" | "deal" | "quote" | "invoice" | "task" | "ticket" | "product" | "finance" | "meeting" | "document" | "contract" | "shipment" | "automation" | "activity" | "notification" | "analytics" | "system" | "report",
  "params": {"name":"değer","value":sayı,"status":"değer","id":"id"},
  "confidence": 0.9
}

Örnekler:
"Yeni müşteri ekle: ABC" → {"type":"create","entity":"customer","params":{"name":"ABC"},"confidence":0.9}
"Fırsat oluştur: 50000" → {"type":"create","entity":"deal","params":{"title":"Yeni Fırsat","value":50000},"confidence":0.9}
"Müşterileri listele" → {"type":"list","entity":"customer","confidence":0.9}
"Aktif müşterileri göster" → {"type":"filter","entity":"customer","params":{"status":"ACTIVE"},"confidence":0.9}
"Fırsat durumunu WON yap" → {"type":"update","entity":"deal","params":{"stage":"WON"},"confidence":0.9}
"Müşteri sil: ABC" → {"type":"delete","entity":"customer","params":{"name":"ABC"},"confidence":0.9}

SADECE JSON, başka metin yok.`
    : `User gave this command: "${userInput}"

Analyze this command and respond in JSON format:

{
  "type": "create" | "read" | "update" | "delete" | "summarize" | "generate" | "help" | "check" | "monitor" | "analyze" | "trigger",
  "entity": "customer" | "deal" | "quote" | "invoice" | "task" | "ticket" | "product" | "finance" | "meeting" | "document" | "contract" | "shipment" | "automation" | "activity" | "notification" | "analytics" | "system" | "report",
  "action": "description",
  "params": {
    "name": "value",
    "value": "value",
    ...
  },
  "confidence": 0.0-1.0
}

Examples:
- "Create new customer: ABC Company" → {"type":"create","entity":"customer","params":{"name":"ABC Company"},"confidence":0.9}
- "Generate quote" → {"type":"create","entity":"quote","confidence":0.8}
- "Summarize notes" → {"type":"summarize","entity":"note","confidence":0.9}

Return only JSON, no other explanation.`
}

/**
 * Komut preview - Ne yapacağını gösterir ama işlem yapmaz
 */
export async function generateCommandPreview(
  command: AICommand,
  locale: 'tr' | 'en' = 'tr'
): Promise<{ 
  action: string
  description: string
  details: Record<string, any>
  entityType: string
  entityName: string
}> {
  const isTurkish = locale === 'tr'
  
  const entityNames: Record<string, string> = {
    customer: isTurkish ? 'Müşteri' : 'Customer',
    deal: isTurkish ? 'Fırsat' : 'Deal',
    quote: isTurkish ? 'Teklif' : 'Quote',
    invoice: isTurkish ? 'Fatura' : 'Invoice',
    task: isTurkish ? 'Görev' : 'Task',
    ticket: isTurkish ? 'Destek Talebi' : 'Ticket',
    product: isTurkish ? 'Ürün' : 'Product',
    finance: isTurkish ? 'Finans Kaydı' : 'Finance Record',
    shipment: isTurkish ? 'Sevkiyat' : 'Shipment',
    meeting: isTurkish ? 'Görüşme' : 'Meeting',
    document: isTurkish ? 'Doküman' : 'Document',
    contract: isTurkish ? 'Sözleşme' : 'Contract',
  }

  const actionNames: Record<string, string> = {
    create: isTurkish ? 'Oluştur' : 'Create',
    update: isTurkish ? 'Güncelle' : 'Update',
    delete: isTurkish ? 'Sil' : 'Delete',
    read: isTurkish ? 'Görüntüle' : 'View',
    list: isTurkish ? 'Listele' : 'List',
    show: isTurkish ? 'Göster' : 'Show',
    filter: isTurkish ? 'Filtrele' : 'Filter',
  }

  const entityName = entityNames[command.entity] || command.entity
  const actionName = actionNames[command.type] || command.type

  let description = ''
  let details: Record<string, any> = {}

  switch (command.type) {
    case 'create':
      description = isTurkish 
        ? `${entityName} oluşturulacak`
        : `Will create ${entityName}`
      details = command.params || {}
      break
    case 'update':
      description = isTurkish
        ? `${entityName} güncellenecek`
        : `Will update ${entityName}`
      details = command.params || {}
      break
    case 'delete':
      description = isTurkish
        ? `${entityName} silinecek`
        : `Will delete ${entityName}`
      details = command.params || {}
      break
    case 'read':
    case 'list':
    case 'show':
    case 'filter':
      description = isTurkish
        ? `${entityName} listesi gösterilecek`
        : `Will show ${entityName} list`
      details = command.params || {}
      break
    default:
      description = isTurkish
        ? `${actionName} işlemi yapılacak`
        : `Will perform ${actionName} operation`
      details = command.params || {}
  }

  return {
    action: `${actionName} ${entityName}`,
    description,
    details,
    entityType: command.entity,
    entityName,
  }
}

/**
 * AI komutunu ActivityLog'a kaydet
 */
async function logAICommand(
  command: AICommand,
  result: { success: boolean; message: string; data?: any },
  session: any,
  locale: 'tr' | 'en'
) {
  try {
    const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
    const supabase = getSupabaseWithServiceRole()
    const isTurkish = locale === 'tr'

    const actionMap: Record<string, string> = {
      create: 'CREATE',
      update: 'UPDATE',
      delete: 'DELETE',
      read: 'READ',
      list: 'LIST',
      show: 'SHOW',
      filter: 'FILTER',
      check: 'CHECK',
      monitor: 'MONITOR',
      analyze: 'ANALYZE',
    }

    const entityMap: Record<string, string> = {
      customer: 'Customer',
      deal: 'Deal',
      quote: 'Quote',
      invoice: 'Invoice',
      task: 'Task',
      ticket: 'Ticket',
      product: 'Product',
      finance: 'Finance',
      shipment: 'Shipment',
      meeting: 'Meeting',
      document: 'Document',
      contract: 'Contract',
    }

    const entity = entityMap[command.entity] || command.entity
    const action = actionMap[command.type] || command.type.toUpperCase()

    const description = isTurkish
      ? `AI komutu: ${command.type} ${entity} - ${result.message}`
      : `AI command: ${command.type} ${entity} - ${result.message}`

    await supabase.from('ActivityLog').insert({
      entity: 'AI_COMMAND',
      action: 'AI_EXECUTE',
      description,
      meta: {
        commandType: command.type,
        commandEntity: command.entity,
        commandParams: command.params,
        rawCommand: command.rawCommand,
        result: result.success ? 'SUCCESS' : 'FAILED',
        resultMessage: result.message,
        entityId: result.data?.id,
        entityName: result.data?.name || result.data?.title,
      },
      userId: session?.user?.id,
      companyId: session?.user?.companyId,
    })
  } catch (error) {
    // ActivityLog hatası kritik değil, işlemi durdurma
    console.error('AI Command ActivityLog error:', error)
  }
}

/**
 * Komut çalıştırma - Server-side'da çalışır (API route içinde)
 */
export async function executeAICommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en' = 'tr',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any; link?: string }> {
  try {
    let result: { success: boolean; message: string; data?: any; link?: string }

    switch (command.type) {
      case 'create':
        result = await handleCreateCommand(command, session, locale, request)
        break
      case 'read':
      case 'list':
      case 'show':
      case 'filter':
        result = await handleReadCommand(command, session, locale, request)
        break
      case 'update':
        result = await handleUpdateCommand(command, session, locale, request)
        break
      case 'delete':
        result = await handleDeleteCommand(command, session, locale, request)
        break
      case 'summarize':
        result = await handleSummarizeCommand(command, session, locale, request)
        break
      case 'generate':
        result = await handleGenerateCommand(command, session, locale, request)
        break
      case 'check':
      case 'monitor':
      case 'analyze':
        result = await handleCheckCommand(command, session, locale, request)
        break
      case 'trigger':
        result = await handleTriggerCommand(command, session, locale, request)
        break
      case 'help':
        result = {
          success: true,
          message: locale === 'tr' ? 'Yardım menüsü' : 'Help menu',
          data: COMMAND_EXAMPLES[locale],
        }
        break
      default:
        result = {
          success: false,
          message: locale === 'tr' ? 'Komut anlaşılamadı' : 'Command not understood',
        }
    }

    // ActivityLog'a kaydet (başarılı veya başarısız tüm komutlar)
    await logAICommand(command, result, session, locale)

    return result
  } catch (error: any) {
    const errorResult = {
      success: false,
      message: error.message || (locale === 'tr' ? 'Komut çalıştırılamadı' : 'Command failed'),
    }

    // Hata durumunda da logla
    await logAICommand(command, errorResult, session, locale)

    return errorResult
  }
}

/**
 * Create komutlarını işle - Server-side'da direkt API çağrısı
 */
async function handleCreateCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any; link?: string }> {
  const isTurkish = locale === 'tr'

  // Server-side'da direkt Supabase veya internal API çağrısı yap
  const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
  const supabase = getSupabaseWithServiceRole()

  switch (command.entity) {
    case 'customer': {
      const name = command.params?.name || command.params?.company || 'Yeni Müşteri'
      
      const { data, error } = await supabase
        .from('Customer')
        .insert({
          name,
          status: 'ACTIVE',
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Müşteri oluşturulamadı' : 'Failed to create customer'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Müşteri "${name}" oluşturuldu` : `✅ Customer "${name}" created`,
        data,
        link: `/${locale}/customers/${data.id}`,
      }
    }
    case 'deal': {
      const title = command.params?.title || command.params?.name || 'Yeni Fırsat'
      const value = command.params?.value || command.params?.amount || 0
      const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value

      const { data, error } = await supabase
        .from('Deal')
        .insert({
          title,
          value: numericValue || 0,
          stage: 'LEAD',
          status: 'OPEN',
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Fırsat oluşturulamadı' : 'Failed to create deal'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Fırsat "${title}" oluşturuldu` : `✅ Deal "${title}" created`,
        data,
        link: `/${locale}/deals/${data.id}`,
      }
    }
    case 'task': {
      const title = command.params?.title || command.params?.name || 'Yeni Görev'

      const { data, error } = await supabase
        .from('Task')
        .insert({
          title,
          status: 'PENDING',
          priority: 'MEDIUM',
          companyId: session?.user?.companyId,
          assignedTo: session?.user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Görev oluşturulamadı' : 'Failed to create task'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Görev "${title}" oluşturuldu` : `✅ Task "${title}" created`,
        data,
        link: `/${locale}/tasks/${data.id}`,
      }
    }
    case 'product': {
      const name = command.params?.name || command.params?.title || 'Yeni Ürün'
      const price = command.params?.price || command.params?.value || 0
      const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) : price

      const { data, error } = await supabase
        .from('Product')
        .insert({
          name,
          price: numericPrice || 0,
          stock: 0,
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Ürün oluşturulamadı' : 'Failed to create product'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Ürün "${name}" oluşturuldu` : `✅ Product "${name}" created`,
        data,
        link: `/${locale}/products/${data.id}`,
      }
    }
    case 'meeting': {
      const title = command.params?.title || command.params?.name || 'Yeni Görüşme'
      const meetingDate = command.params?.date || command.params?.meetingDate || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('Meeting')
        .insert({
          title,
          meetingDate,
          status: 'PLANNED',
          meetingType: 'IN_PERSON',
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Görüşme oluşturulamadı' : 'Failed to create meeting'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Görüşme "${title}" oluşturuldu` : `✅ Meeting "${title}" created`,
        data,
        link: `/${locale}/meetings/${data.id}`,
      }
    }
    case 'invoice': {
      return {
        success: false,
        message: isTurkish ? 'Fatura için lütfen fatura formunu kullanın' : 'Please use the invoice form',
      }
    }
    case 'quote': {
      return {
        success: false,
        message: isTurkish ? 'Teklif için lütfen teklif formunu kullanın' : 'Please use the quote form',
      }
    }
    case 'finance': {
      const type = command.params?.type || 'INCOME'
      const amount = command.params?.amount || command.params?.value || 0
      const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.')) : amount
      const category = command.params?.category || 'OTHER'
      const description = command.params?.description || command.params?.name || 'Yeni Finans Kaydı'

      const { data, error } = await supabase
        .from('Finance')
        .insert({
          type,
          amount: numericAmount || 0,
          category,
          description,
          transactionDate: command.params?.date || new Date().toISOString().split('T')[0],
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Finans kaydı oluşturulamadı' : 'Failed to create finance record'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Finans kaydı oluşturuldu` : `✅ Finance record created`,
        data,
        link: `/${locale}/finance/${data.id}`,
      }
    }
    case 'contract': {
      const contractNumber = command.params?.contractNumber || command.params?.number || 'YENI-SOZ'
      const startDate = command.params?.startDate || command.params?.date || new Date().toISOString().split('T')[0]
      const endDate = command.params?.endDate || command.params?.endDate

      const { data, error } = await supabase
        .from('Contract')
        .insert({
          contractNumber,
          startDate,
          endDate: endDate || null,
          status: 'ACTIVE',
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Sözleşme oluşturulamadı' : 'Failed to create contract'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Sözleşme oluşturuldu` : `✅ Contract created`,
        data,
        link: `/${locale}/contracts/${data.id}`,
      }
    }
    case 'shipment': {
      return {
        success: false,
        message: isTurkish ? 'Sevkiyat için lütfen sevkiyat formunu kullanın' : 'Please use the shipment form',
      }
    }
    case 'document': {
      return {
        success: false,
        message: isTurkish ? 'Doküman için lütfen doküman yükleme formunu kullanın' : 'Please use the document upload form',
      }
    }
    case 'ticket': {
      const title = command.params?.title || command.params?.name || 'Yeni Destek Talebi'

      const { data, error } = await supabase
        .from('Ticket')
        .insert({
          title,
          status: 'OPEN',
          priority: 'MEDIUM',
          category: 'OTHER',
          companyId: session?.user?.companyId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || (isTurkish ? 'Destek talebi oluşturulamadı' : 'Failed to create ticket'))
      }

      return {
        success: true,
        message: isTurkish ? `✅ Destek talebi "${title}" oluşturuldu` : `✅ Ticket "${title}" created`,
        data,
        link: `/${locale}/tickets/${data.id}`,
      }
    }
    default:
      return {
        success: false,
        message: isTurkish ? 'Bu işlem desteklenmiyor' : 'Operation not supported',
      }
  }
}

/**
 * Read/List komutlarını işle - Veri listeleme ve filtreleme
 */
async function handleReadCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any }> {
  const isTurkish = locale === 'tr'
  const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
  const supabase = getSupabaseWithServiceRole()

  const filters: any = { companyId: session?.user?.companyId }
  
  // Filtre parametrelerini ekle
  if (command.params?.status) filters.status = command.params.status
  if (command.params?.stage) filters.stage = command.params.stage

  switch (command.entity) {
    case 'customer': {
      let query = supabase.from('Customer').select('id, name, email, phone, status').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      if (command.params?.search) query = query.ilike('name', `%${command.params.search}%`)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Müşteriler alınamadı' : 'Failed to fetch customers'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} müşteri bulundu` : `✅ Found ${data?.length || 0} customers`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'deal': {
      let query = supabase.from('Deal').select('id, title, value, stage, status').eq('companyId', session?.user?.companyId)
      if (filters.stage) query = query.eq('stage', filters.stage)
      if (filters.status) query = query.eq('status', filters.status)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Fırsatlar alınamadı' : 'Failed to fetch deals'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} fırsat bulundu` : `✅ Found ${data?.length || 0} deals`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'task': {
      let query = supabase.from('Task').select('id, title, status, priority').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Görevler alınamadı' : 'Failed to fetch tasks'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} görev bulundu` : `✅ Found ${data?.length || 0} tasks`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'meeting': {
      let query = supabase.from('Meeting').select('id, title, meetingDate, status').eq('companyId', session?.user?.companyId)
      if (command.params?.date) query = query.eq('meetingDate', command.params.date)
      if (command.params?.today) query = query.eq('meetingDate', new Date().toISOString().split('T')[0])
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Görüşmeler alınamadı' : 'Failed to fetch meetings'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} görüşme bulundu` : `✅ Found ${data?.length || 0} meetings`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'quote': {
      let query = supabase.from('Quote').select('id, title, status, totalAmount, dealId').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      if (command.params?.search) query = query.ilike('title', `%${command.params.search}%`)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Teklifler alınamadı' : 'Failed to fetch quotes'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} teklif bulundu` : `✅ Found ${data?.length || 0} quotes`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'invoice': {
      let query = supabase.from('Invoice').select('id, title, status, totalAmount, invoiceNumber').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      if (command.params?.search) query = query.ilike('title', `%${command.params.search}%`)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Faturalar alınamadı' : 'Failed to fetch invoices'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} fatura bulundu` : `✅ Found ${data?.length || 0} invoices`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'shipment': {
      let query = supabase.from('Shipment').select('id, shipmentNumber, status, invoiceId').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Sevkiyatlar alınamadı' : 'Failed to fetch shipments'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} sevkiyat bulundu` : `✅ Found ${data?.length || 0} shipments`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'finance': {
      let query = supabase.from('Finance').select('id, type, amount, category, transactionDate').eq('companyId', session?.user?.companyId)
      if (command.params?.type) query = query.eq('type', command.params.type)
      if (command.params?.category) query = query.eq('category', command.params.category)
      
      const { data, error } = await query.order('transactionDate', { ascending: false }).limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Finans kayıtları alınamadı' : 'Failed to fetch finance records'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} finans kaydı bulundu` : `✅ Found ${data?.length || 0} finance records`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'contract': {
      let query = supabase.from('Contract').select('id, contractNumber, status, startDate, endDate').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Sözleşmeler alınamadı' : 'Failed to fetch contracts'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} sözleşme bulundu` : `✅ Found ${data?.length || 0} contracts`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'product': {
      let query = supabase.from('Product').select('id, name, price, stock, status').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      if (command.params?.search) query = query.ilike('name', `%${command.params.search}%`)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Ürünler alınamadı' : 'Failed to fetch products'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} ürün bulundu` : `✅ Found ${data?.length || 0} products`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'ticket': {
      let query = supabase.from('Ticket').select('id, title, status, priority, category').eq('companyId', session?.user?.companyId)
      if (filters.status) query = query.eq('status', filters.status)
      if (command.params?.search) query = query.ilike('title', `%${command.params.search}%`)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Destek talepleri alınamadı' : 'Failed to fetch tickets'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} destek talebi bulundu` : `✅ Found ${data?.length || 0} tickets`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    case 'document': {
      let query = supabase.from('Document').select('id, title, fileName, fileType, folder, relatedTo').eq('companyId', session?.user?.companyId)
      if (command.params?.folder) query = query.eq('folder', command.params.folder)
      if (command.params?.relatedTo) query = query.eq('relatedTo', command.params.relatedTo)
      if (command.params?.search) query = query.ilike('title', `%${command.params.search}%`)
      
      const { data, error } = await query.limit(20)
      if (error) throw new Error(error.message || (isTurkish ? 'Dokümanlar alınamadı' : 'Failed to fetch documents'))
      
      return {
        success: true,
        message: isTurkish ? `✅ ${data?.length || 0} doküman bulundu` : `✅ Found ${data?.length || 0} documents`,
        data: { items: data, count: data?.length || 0 },
      }
    }
    default:
      return {
        success: false,
        message: isTurkish ? 'Bu varlık için listeleme desteklenmiyor' : 'Listing not supported for this entity',
      }
  }
}

/**
 * Update komutlarını işle - Kayıt güncelleme
 */
async function handleUpdateCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any; link?: string }> {
  const isTurkish = locale === 'tr'
  const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
  const supabase = getSupabaseWithServiceRole()

  const updateData: any = {}
  if (command.params?.status) updateData.status = command.params.status
  if (command.params?.stage) updateData.stage = command.params.stage
  if (command.params?.title) updateData.title = command.params.title
  if (command.params?.value) updateData.value = command.params.value

  switch (command.entity) {
    case 'deal': {
      const id = command.params?.id
      if (!id) {
        // ID yoksa isimle bul
        const { data: found } = await supabase
          .from('Deal')
          .select('id')
          .eq('companyId', session?.user?.companyId)
          .ilike('title', `%${command.params?.name || command.params?.title || ''}%`)
          .limit(1)
          .single()
        
        if (!found) {
          return { success: false, message: isTurkish ? 'Fırsat bulunamadı' : 'Deal not found' }
        }
        updateData.id = found.id
      } else {
        updateData.id = id
      }

      const { data, error } = await supabase
        .from('Deal')
        .update(updateData)
        .eq('id', updateData.id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Fırsat güncellenemedi' : 'Failed to update deal'))

      return {
        success: true,
        message: isTurkish ? `✅ Fırsat güncellendi` : `✅ Deal updated`,
        data,
        link: `/${locale}/deals/${data.id}`,
      }
    }
    case 'task': {
      const id = command.params?.id
      if (!id) {
        const { data: found } = await supabase
          .from('Task')
          .select('id')
          .eq('companyId', session?.user?.companyId)
          .ilike('title', `%${command.params?.name || command.params?.title || ''}%`)
          .limit(1)
          .single()
        
        if (!found) {
          return { success: false, message: isTurkish ? 'Görev bulunamadı' : 'Task not found' }
        }
        updateData.id = found.id
      } else {
        updateData.id = id
      }

      const { data, error } = await supabase
        .from('Task')
        .update(updateData)
        .eq('id', updateData.id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Görev güncellenemedi' : 'Failed to update task'))

      return {
        success: true,
        message: isTurkish ? `✅ Görev güncellendi` : `✅ Task updated`,
        data,
        link: `/${locale}/tasks/${data.id}`,
      }
    }
    case 'customer': {
      const id = command.params?.id
      if (!id) {
        const { data: found } = await supabase
          .from('Customer')
          .select('id')
          .eq('companyId', session?.user?.companyId)
          .ilike('name', `%${command.params?.name || ''}%`)
          .limit(1)
          .single()
        
        if (!found) {
          return { success: false, message: isTurkish ? 'Müşteri bulunamadı' : 'Customer not found' }
        }
        updateData.id = found.id
      } else {
        updateData.id = id
      }

      if (command.params?.name) updateData.name = command.params.name
      if (command.params?.email) updateData.email = command.params.email
      if (command.params?.phone) updateData.phone = command.params.phone

      const { data, error } = await supabase
        .from('Customer')
        .update(updateData)
        .eq('id', updateData.id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Müşteri güncellenemedi' : 'Failed to update customer'))

      return {
        success: true,
        message: isTurkish ? `✅ Müşteri güncellendi` : `✅ Customer updated`,
        data,
        link: `/${locale}/customers/${data.id}`,
      }
    }
    case 'product': {
      const id = command.params?.id
      if (!id) {
        const { data: found } = await supabase
          .from('Product')
          .select('id')
          .eq('companyId', session?.user?.companyId)
          .ilike('name', `%${command.params?.name || ''}%`)
          .limit(1)
          .single()
        
        if (!found) {
          return { success: false, message: isTurkish ? 'Ürün bulunamadı' : 'Product not found' }
        }
        updateData.id = found.id
      } else {
        updateData.id = id
      }

      if (command.params?.name) updateData.name = command.params.name
      if (command.params?.price) updateData.price = command.params.price
      if (command.params?.stock !== undefined) updateData.stock = command.params.stock

      const { data, error } = await supabase
        .from('Product')
        .update(updateData)
        .eq('id', updateData.id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Ürün güncellenemedi' : 'Failed to update product'))

      return {
        success: true,
        message: isTurkish ? `✅ Ürün güncellendi` : `✅ Product updated`,
        data,
        link: `/${locale}/products/${data.id}`,
      }
    }
    case 'quote': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Teklif ID gerekli' : 'Quote ID required' }
      }

      if (command.params?.status) updateData.status = command.params.status
      if (command.params?.totalAmount) updateData.totalAmount = command.params.totalAmount

      const { data, error } = await supabase
        .from('Quote')
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Teklif güncellenemedi' : 'Failed to update quote'))

      return {
        success: true,
        message: isTurkish ? `✅ Teklif güncellendi` : `✅ Quote updated`,
        data,
        link: `/${locale}/quotes/${data.id}`,
      }
    }
    case 'invoice': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Fatura ID gerekli' : 'Invoice ID required' }
      }

      if (command.params?.status) updateData.status = command.params.status
      if (command.params?.totalAmount) updateData.totalAmount = command.params.totalAmount

      const { data, error } = await supabase
        .from('Invoice')
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Fatura güncellenemedi' : 'Failed to update invoice'))

      return {
        success: true,
        message: isTurkish ? `✅ Fatura güncellendi` : `✅ Invoice updated`,
        data,
        link: `/${locale}/invoices/${data.id}`,
      }
    }
    case 'task': {
      // Zaten var, ama meeting ve ticket ekleyelim
    }
    case 'meeting': {
      const id = command.params?.id
      if (!id) {
        const { data: found } = await supabase
          .from('Meeting')
          .select('id')
          .eq('companyId', session?.user?.companyId)
          .ilike('title', `%${command.params?.name || command.params?.title || ''}%`)
          .limit(1)
          .single()
        
        if (!found) {
          return { success: false, message: isTurkish ? 'Görüşme bulunamadı' : 'Meeting not found' }
        }
        updateData.id = found.id
      } else {
        updateData.id = id
      }

      if (command.params?.title) updateData.title = command.params.title
      if (command.params?.meetingDate) updateData.meetingDate = command.params.meetingDate
      if (command.params?.status) updateData.status = command.params.status

      const { data, error } = await supabase
        .from('Meeting')
        .update(updateData)
        .eq('id', updateData.id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Görüşme güncellenemedi' : 'Failed to update meeting'))

      return {
        success: true,
        message: isTurkish ? `✅ Görüşme güncellendi` : `✅ Meeting updated`,
        data,
        link: `/${locale}/meetings/${data.id}`,
      }
    }
    case 'ticket': {
      const id = command.params?.id
      if (!id) {
        const { data: found } = await supabase
          .from('Ticket')
          .select('id')
          .eq('companyId', session?.user?.companyId)
          .ilike('title', `%${command.params?.name || command.params?.title || ''}%`)
          .limit(1)
          .single()
        
        if (!found) {
          return { success: false, message: isTurkish ? 'Destek talebi bulunamadı' : 'Ticket not found' }
        }
        updateData.id = found.id
      } else {
        updateData.id = id
      }

      if (command.params?.title) updateData.title = command.params.title
      if (command.params?.status) updateData.status = command.params.status
      if (command.params?.priority) updateData.priority = command.params.priority

      const { data, error } = await supabase
        .from('Ticket')
        .update(updateData)
        .eq('id', updateData.id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Destek talebi güncellenemedi' : 'Failed to update ticket'))

      return {
        success: true,
        message: isTurkish ? `✅ Destek talebi güncellendi` : `✅ Ticket updated`,
        data,
        link: `/${locale}/tickets/${data.id}`,
      }
    }
    case 'finance': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Finans kaydı ID gerekli' : 'Finance record ID required' }
      }

      if (command.params?.amount) updateData.amount = command.params.amount
      if (command.params?.type) updateData.type = command.params.type
      if (command.params?.category) updateData.category = command.params.category

      const { data, error } = await supabase
        .from('Finance')
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Finans kaydı güncellenemedi' : 'Failed to update finance record'))

      return {
        success: true,
        message: isTurkish ? `✅ Finans kaydı güncellendi` : `✅ Finance record updated`,
        data,
        link: `/${locale}/finance/${data.id}`,
      }
    }
    case 'contract': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Sözleşme ID gerekli' : 'Contract ID required' }
      }

      if (command.params?.status) updateData.status = command.params.status
      if (command.params?.startDate) updateData.startDate = command.params.startDate
      if (command.params?.endDate) updateData.endDate = command.params.endDate

      const { data, error } = await supabase
        .from('Contract')
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Sözleşme güncellenemedi' : 'Failed to update contract'))

      return {
        success: true,
        message: isTurkish ? `✅ Sözleşme güncellendi` : `✅ Contract updated`,
        data,
        link: `/${locale}/contracts/${data.id}`,
      }
    }
    case 'shipment': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Sevkiyat ID gerekli' : 'Shipment ID required' }
      }

      if (command.params?.status) updateData.status = command.params.status

      const { data, error } = await supabase
        .from('Shipment')
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Sevkiyat güncellenemedi' : 'Failed to update shipment'))

      return {
        success: true,
        message: isTurkish ? `✅ Sevkiyat güncellendi` : `✅ Shipment updated`,
        data,
        link: `/${locale}/shipments/${data.id}`,
      }
    }
    case 'document': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Doküman ID gerekli' : 'Document ID required' }
      }

      if (command.params?.title) updateData.title = command.params.title
      if (command.params?.folder) updateData.folder = command.params.folder

      const { data, error } = await supabase
        .from('Document')
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)
        .select()
        .single()

      if (error) throw new Error(error.message || (isTurkish ? 'Doküman güncellenemedi' : 'Failed to update document'))

      return {
        success: true,
        message: isTurkish ? `✅ Doküman güncellendi` : `✅ Document updated`,
        data,
        link: `/${locale}/documents/${data.id}`,
      }
    }
    default:
      return {
        success: false,
        message: isTurkish ? 'Bu varlık için güncelleme desteklenmiyor' : 'Update not supported for this entity',
      }
  }
}

/**
 * Delete komutlarını işle - Kayıt silme
 */
async function handleDeleteCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any; link?: string }> {
  const isTurkish = locale === 'tr'
  const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
  const supabase = getSupabaseWithServiceRole()

  switch (command.entity) {
    case 'customer': {
      const name = command.params?.name
      if (!name) {
        return { success: false, message: isTurkish ? 'Müşteri adı gerekli' : 'Customer name required' }
      }

      // İsimle bul
      const { data: found } = await supabase
        .from('Customer')
        .select('id')
        .eq('companyId', session?.user?.companyId)
        .ilike('name', `%${name}%`)
        .limit(1)
        .single()

      if (!found) {
        return { success: false, message: isTurkish ? 'Müşteri bulunamadı' : 'Customer not found' }
      }

      const { error } = await supabase
        .from('Customer')
        .delete()
        .eq('id', found.id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Müşteri silinemedi' : 'Failed to delete customer'))

      return {
        success: true,
        message: isTurkish ? `✅ Müşteri "${name}" silindi` : `✅ Customer "${name}" deleted`,
      }
    }
    case 'deal': {
      const name = command.params?.name || command.params?.title
      if (!name) {
        return { success: false, message: isTurkish ? 'Fırsat adı gerekli' : 'Deal name required' }
      }

      const { data: found } = await supabase
        .from('Deal')
        .select('id')
        .eq('companyId', session?.user?.companyId)
        .ilike('title', `%${name}%`)
        .limit(1)
        .single()

      if (!found) {
        return { success: false, message: isTurkish ? 'Fırsat bulunamadı' : 'Deal not found' }
      }

      const { error } = await supabase
        .from('Deal')
        .delete()
        .eq('id', found.id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Fırsat silinemedi' : 'Failed to delete deal'))

      return {
        success: true,
        message: isTurkish ? `✅ Fırsat "${name}" silindi` : `✅ Deal "${name}" deleted`,
      }
    }
    case 'task': {
      const name = command.params?.name || command.params?.title
      if (!name) {
        return { success: false, message: isTurkish ? 'Görev adı gerekli' : 'Task name required' }
      }

      const { data: found } = await supabase
        .from('Task')
        .select('id')
        .eq('companyId', session?.user?.companyId)
        .ilike('title', `%${name}%`)
        .limit(1)
        .single()

      if (!found) {
        return { success: false, message: isTurkish ? 'Görev bulunamadı' : 'Task not found' }
      }

      const { error } = await supabase
        .from('Task')
        .delete()
        .eq('id', found.id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Görev silinemedi' : 'Failed to delete task'))

      return {
        success: true,
        message: isTurkish ? `✅ Görev "${name}" silindi` : `✅ Task "${name}" deleted`,
      }
    }
    case 'product': {
      const name = command.params?.name
      if (!name) {
        return { success: false, message: isTurkish ? 'Ürün adı gerekli' : 'Product name required' }
      }

      const { data: found } = await supabase
        .from('Product')
        .select('id')
        .eq('companyId', session?.user?.companyId)
        .ilike('name', `%${name}%`)
        .limit(1)
        .single()

      if (!found) {
        return { success: false, message: isTurkish ? 'Ürün bulunamadı' : 'Product not found' }
      }

      const { error } = await supabase
        .from('Product')
        .delete()
        .eq('id', found.id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Ürün silinemedi' : 'Failed to delete product'))

      return {
        success: true,
        message: isTurkish ? `✅ Ürün "${name}" silindi` : `✅ Product "${name}" deleted`,
      }
    }
    case 'meeting': {
      const name = command.params?.name || command.params?.title
      if (!name) {
        return { success: false, message: isTurkish ? 'Görüşme adı gerekli' : 'Meeting name required' }
      }

      const { data: found } = await supabase
        .from('Meeting')
        .select('id')
        .eq('companyId', session?.user?.companyId)
        .ilike('title', `%${name}%`)
        .limit(1)
        .single()

      if (!found) {
        return { success: false, message: isTurkish ? 'Görüşme bulunamadı' : 'Meeting not found' }
      }

      const { error } = await supabase
        .from('Meeting')
        .delete()
        .eq('id', found.id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Görüşme silinemedi' : 'Failed to delete meeting'))

      return {
        success: true,
        message: isTurkish ? `✅ Görüşme "${name}" silindi` : `✅ Meeting "${name}" deleted`,
      }
    }
    case 'ticket': {
      const name = command.params?.name || command.params?.title
      if (!name) {
        return { success: false, message: isTurkish ? 'Destek talebi adı gerekli' : 'Ticket name required' }
      }

      const { data: found } = await supabase
        .from('Ticket')
        .select('id')
        .eq('companyId', session?.user?.companyId)
        .ilike('title', `%${name}%`)
        .limit(1)
        .single()

      if (!found) {
        return { success: false, message: isTurkish ? 'Destek talebi bulunamadı' : 'Ticket not found' }
      }

      const { error } = await supabase
        .from('Ticket')
        .delete()
        .eq('id', found.id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Destek talebi silinemedi' : 'Failed to delete ticket'))

      return {
        success: true,
        message: isTurkish ? `✅ Destek talebi "${name}" silindi` : `✅ Ticket "${name}" deleted`,
      }
    }
    case 'quote': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Teklif ID gerekli' : 'Quote ID required' }
      }

      const { error } = await supabase
        .from('Quote')
        .delete()
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Teklif silinemedi' : 'Failed to delete quote'))

      return {
        success: true,
        message: isTurkish ? `✅ Teklif silindi` : `✅ Quote deleted`,
      }
    }
    case 'invoice': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Fatura ID gerekli' : 'Invoice ID required' }
      }

      const { error } = await supabase
        .from('Invoice')
        .delete()
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Fatura silinemedi' : 'Failed to delete invoice'))

      return {
        success: true,
        message: isTurkish ? `✅ Fatura silindi` : `✅ Invoice deleted`,
      }
    }
    case 'shipment': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Sevkiyat ID gerekli' : 'Shipment ID required' }
      }

      const { error } = await supabase
        .from('Shipment')
        .delete()
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Sevkiyat silinemedi' : 'Failed to delete shipment'))

      return {
        success: true,
        message: isTurkish ? `✅ Sevkiyat silindi` : `✅ Shipment deleted`,
      }
    }
    case 'finance': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Finans kaydı ID gerekli' : 'Finance record ID required' }
      }

      const { error } = await supabase
        .from('Finance')
        .delete()
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Finans kaydı silinemedi' : 'Failed to delete finance record'))

      return {
        success: true,
        message: isTurkish ? `✅ Finans kaydı silindi` : `✅ Finance record deleted`,
      }
    }
    case 'contract': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Sözleşme ID gerekli' : 'Contract ID required' }
      }

      const { error } = await supabase
        .from('Contract')
        .delete()
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Sözleşme silinemedi' : 'Failed to delete contract'))

      return {
        success: true,
        message: isTurkish ? `✅ Sözleşme silindi` : `✅ Contract deleted`,
      }
    }
    case 'document': {
      const id = command.params?.id
      if (!id) {
        return { success: false, message: isTurkish ? 'Doküman ID gerekli' : 'Document ID required' }
      }

      const { error } = await supabase
        .from('Document')
        .delete()
        .eq('id', id)
        .eq('companyId', session?.user?.companyId)

      if (error) throw new Error(error.message || (isTurkish ? 'Doküman silinemedi' : 'Failed to delete document'))

      return {
        success: true,
        message: isTurkish ? `✅ Doküman silindi` : `✅ Document deleted`,
      }
    }
    default:
      return {
        success: false,
        message: isTurkish ? 'Bu varlık için silme desteklenmiyor' : 'Delete not supported for this entity',
      }
  }
}

/**
 * Summarize komutlarını işle
 */
async function handleSummarizeCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any }> {
  return {
    success: false,
    message: locale === 'tr' ? 'Özetleme için detay sayfasını kullanın' : 'Use detail page for summarization',
  }
}

/**
 * Generate komutlarını işle
 */
async function handleGenerateCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any }> {
  return {
    success: false,
    message: locale === 'tr' ? 'Oluşturma için ilgili formu kullanın' : 'Use relevant form for generation',
  }
}

/**
 * Check/Monitor/Analyze komutlarını işle - Otomasyon kontrolü, sistem durumu, analytics
 */
async function handleCheckCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any }> {
  const isTurkish = locale === 'tr'
  const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
  const supabase = getSupabaseWithServiceRole()

  switch (command.entity) {
    case 'automation': {
      // Son ActivityLog kayıtlarını kontrol et (otomasyon geçmişi)
      const { data: activities, error } = await supabase
        .from('ActivityLog')
        .select('id, entity, action, description, createdAt, meta')
        .eq('companyId', session?.user?.companyId)
        .or('meta->>action.ilike.%automation%,meta->>action.ilike.%trigger%,meta->>action.ilike.%auto%')
        .order('createdAt', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message || (isTurkish ? 'Otomasyon geçmişi alınamadı' : 'Failed to fetch automation history'))

      return {
        success: true,
        message: isTurkish ? `✅ ${activities?.length || 0} otomasyon kaydı bulundu` : `✅ Found ${activities?.length || 0} automation records`,
        data: { items: activities, count: activities?.length || 0 },
      }
    }
    case 'activity': {
      // Son ActivityLog kayıtlarını göster
      const limit = command.params?.limit || 20
      const { data: activities, error } = await supabase
        .from('ActivityLog')
        .select('id, entity, action, description, createdAt, User(name)')
        .eq('companyId', session?.user?.companyId)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message || (isTurkish ? 'Aktivite geçmişi alınamadı' : 'Failed to fetch activity log'))

      return {
        success: true,
        message: isTurkish ? `✅ Son ${activities?.length || 0} aktivite gösteriliyor` : `✅ Showing last ${activities?.length || 0} activities`,
        data: { items: activities, count: activities?.length || 0 },
      }
    }
    case 'notification': {
      // Okunmamış bildirimleri göster
      const { data: notifications, error } = await supabase
        .from('Notification')
        .select('id, title, message, type, priority, createdAt, read')
        .eq('companyId', session?.user?.companyId)
        .eq('read', false)
        .order('createdAt', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message || (isTurkish ? 'Bildirimler alınamadı' : 'Failed to fetch notifications'))

      return {
        success: true,
        message: isTurkish ? `✅ ${notifications?.length || 0} okunmamış bildirim bulundu` : `✅ Found ${notifications?.length || 0} unread notifications`,
        data: { items: notifications, count: notifications?.length || 0 },
      }
    }
    case 'analytics': {
      // Dashboard KPI'larını çek
      try {
        const baseUrl = request?.url ? new URL(request.url).origin : ''
        const kpiResponse = await fetch(`${baseUrl}/api/analytics/kpis`, {
          headers: request?.headers ? Object.fromEntries(request.headers.entries()) : {},
        })
        
        if (!kpiResponse.ok) {
          throw new Error(isTurkish ? 'Analytics verileri alınamadı' : 'Failed to fetch analytics')
        }

        const kpiData = await kpiResponse.json()

        return {
          success: true,
          message: isTurkish ? '✅ Dashboard istatistikleri alındı' : '✅ Dashboard statistics retrieved',
          data: kpiData,
        }
      } catch (error: any) {
        throw new Error(error.message || (isTurkish ? 'Analytics verileri alınamadı' : 'Failed to fetch analytics'))
      }
    }
    case 'system': {
      // Sistem durumunu kontrol et (veritabanı, trigger'lar)
      // Temel sistem bilgileri
      const systemInfo: any = {
        timestamp: new Date().toISOString(),
        companyId: session?.user?.companyId,
      }

      // Son 24 saatteki aktivite sayısı
      const { count: activityCount } = await supabase
        .from('ActivityLog')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', session?.user?.companyId)
        .gte('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Okunmamış bildirim sayısı
      const { count: notificationCount } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', session?.user?.companyId)
        .eq('read', false)

      // Son 24 saatteki otomasyon sayısı
      const { count: automationCount } = await supabase
        .from('ActivityLog')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', session?.user?.companyId)
        .gte('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .or('meta->>action.ilike.%automation%,meta->>action.ilike.%trigger%,meta->>action.ilike.%auto%')

      systemInfo.stats = {
        activitiesLast24h: activityCount || 0,
        unreadNotifications: notificationCount || 0,
        automationsLast24h: automationCount || 0,
      }

      return {
        success: true,
        message: isTurkish ? '✅ Sistem durumu kontrol edildi' : '✅ System status checked',
        data: systemInfo,
      }
    }
    default:
      return {
        success: false,
        message: isTurkish ? 'Bu kontrol işlemi desteklenmiyor' : 'This check operation is not supported',
      }
  }
}

/**
 * Trigger komutlarını işle - Otomasyon tetikleme (opsiyonel, güvenlik için sınırlı)
 */
async function handleTriggerCommand(
  command: AICommand,
  session: any,
  locale: 'tr' | 'en',
  request?: Request
): Promise<{ success: boolean; message: string; data?: any }> {
  const isTurkish = locale === 'tr'
  
  // Güvenlik: Sadece ADMIN ve SUPER_ADMIN trigger yapabilir
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
    return {
      success: false,
      message: isTurkish ? 'Otomasyon tetikleme yetkiniz yok' : 'You do not have permission to trigger automations',
    }
  }

  // Şimdilik sadece bilgi ver, gerçek trigger yapma (güvenlik için)
  return {
    success: false,
    message: isTurkish ? 'Otomasyon tetikleme özelliği henüz aktif değil' : 'Automation triggering feature is not yet active',
  }
}

