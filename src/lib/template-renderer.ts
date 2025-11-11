/**
 * Template Renderer - E-posta şablonlarını render eder
 * 
 * {{variableName}} formatındaki değişkenleri değiştirir
 */

export interface TemplateVariables {
  [key: string]: string | number | null | undefined
}

/**
 * Template'i render et
 * 
 * @param template - Template string ({{variableName}} formatında değişkenler içerebilir)
 * @param variables - Değişkenler objesi
 * @returns Render edilmiş string
 * 
 * @example
 * renderTemplate('Merhaba {{customerName}}!', { customerName: 'Ahmet' })
 * // => 'Merhaba Ahmet!'
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  if (!template) return ''

  let rendered = template

  // {{variableName}} formatındaki değişkenleri değiştir
  Object.keys(variables).forEach((key) => {
    const value = variables[key] ?? ''
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    rendered = rendered.replace(regex, String(value))
  })

  return rendered
}

/**
 * Email template'i veritabanından çek ve render et
 * 
 * @param category - Template kategorisi (QUOTE, INVOICE, DEAL, CUSTOMER, GENERAL)
 * @param companyId - Şirket ID
 * @param variables - Template değişkenleri
 * @returns Render edilmiş subject ve body, veya null (template bulunamazsa)
 */
export async function getAndRenderEmailTemplate(
  category: string,
  companyId: string,
  variables: TemplateVariables
): Promise<{ subject: string; body: string } | null> {
  try {
    const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
    const supabase = getSupabaseWithServiceRole()

    // Aktif template'i çek
    const { data: template, error } = await supabase
      .from('EmailTemplate')
      .select('*')
      .eq('category', category)
      .eq('companyId', companyId)
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (error || !template) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`No email template found for category: ${category}`)
      }
      return null
    }

    // Template'i render et
    const subject = renderTemplate(template.subject || '', variables)
    const body = renderTemplate(template.body, variables)

    return { subject, body }
  } catch (error) {
    console.error('Error getting email template:', error)
    return null
  }
}

/**
 * Template değişkenlerini otomatik doldur (sistem olaylarından)
 * 
 * @param entityType - Entity tipi (Quote, Invoice, Deal, Customer)
 * @param entityData - Entity verisi
 * @param companyId - Şirket ID
 * @returns Template değişkenleri objesi
 */
export async function getTemplateVariables(
  entityType: 'Quote' | 'Invoice' | 'Deal' | 'Customer',
  entityData: any,
  companyId: string
): Promise<TemplateVariables> {
  const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
  const supabase = getSupabaseWithServiceRole()

  // Company bilgisini çek
  const { data: company } = await supabase
    .from('Company')
    .select('name')
    .eq('id', companyId)
    .single()

  const variables: TemplateVariables = {
    companyName: company?.name || 'Şirket',
    userName: 'Sistem',
  }

  // Entity tipine göre değişkenleri doldur
  if (entityType === 'Quote') {
    variables.quoteTitle = entityData.title || ''
    variables.quoteTotal = entityData.total || 0
    variables.quoteNumber = entityData.quoteNumber || ''
    
    // Deal ve Customer bilgilerini çek
    if (entityData.dealId) {
      const { data: deal } = await supabase
        .from('Deal')
        .select('title, value, Customer(name, email)')
        .eq('id', entityData.dealId)
        .single()

      if (deal) {
        variables.dealTitle = deal.title || ''
        variables.dealValue = deal.value || 0
        variables.customerName = (deal as any).Customer?.name || ''
        variables.customerEmail = (deal as any).Customer?.email || ''
      }
    }
  } else if (entityType === 'Invoice') {
    variables.invoiceTitle = entityData.title || ''
    variables.invoiceTotal = entityData.total || 0
    variables.invoiceNumber = entityData.invoiceNumber || ''
    
    // Quote, Deal ve Customer bilgilerini çek
    if (entityData.quoteId) {
      const { data: quote } = await supabase
        .from('Quote')
        .select('title, total, Deal(Customer(name, email))')
        .eq('id', entityData.quoteId)
        .single()

      if (quote) {
        variables.quoteTitle = quote.title || ''
        variables.quoteTotal = quote.total || 0
        variables.customerName = (quote as any).Deal?.Customer?.name || ''
        variables.customerEmail = (quote as any).Deal?.Customer?.email || ''
      }
    }
  } else if (entityType === 'Deal') {
    variables.dealTitle = entityData.title || ''
    variables.dealValue = entityData.value || 0
    
    // Customer bilgilerini çek
    if (entityData.customerId) {
      const { data: customer } = await supabase
        .from('Customer')
        .select('name, email')
        .eq('id', entityData.customerId)
        .single()

      if (customer) {
        variables.customerName = customer.name || ''
        variables.customerEmail = customer.email || ''
      }
    }
  } else if (entityType === 'Customer') {
    variables.customerName = entityData.name || ''
    variables.customerEmail = entityData.email || ''
  }

  return variables
}



