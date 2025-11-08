/**
 * Seed Data with Faker.js
 * Demo veriler için realistic data
 */

// Environment variables yükle
require('dotenv').config({ path: '.env.local' })

// Faker kullanımı
const { faker } = require('@faker-js/faker')

// Supabase client import
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Service role key gerekli - RLS bypass için')
  process.exit(1)
}

// Service role key ile RLS bypass
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

interface SeedData {
  companies: any[]
  users: any[]
  customers: any[]
  deals: any[]
  quotes: any[]
  invoices: any[]
  products: any[]
  finance: any[]
  activityLogs: any[]
}

async function seedDatabase() {
  // Faker locale'i Türkçe yap
  faker.locale = 'tr'
  
  // Faker seed'i ayarla (consistent data için)
  faker.seed(12345)

  // ⚠️ ÖNCE TÜM VERİLERİ TEMİZLE (CASCADE DELETE ile otomatik silinir)
  console.log('🧹 Mevcut veriler temizleniyor...')
  await supabase.from('ActivityLog').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Task').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Ticket').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Shipment').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Finance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Product').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Invoice').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Quote').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Deal').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Customer').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('User').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('Company').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('✅ Veriler temizlendi\n')

  const seedData: SeedData = {
    companies: [],
    users: [],
    customers: [],
    deals: [],
    quotes: [],
    invoices: [],
    products: [],
    finance: [],
    activityLogs: [],
  }

  // 3 Demo Company
  const companies = [
    { name: 'Tipplus Medikal', sector: 'Sağlık', city: 'Ankara' },
    { name: 'Global Un', sector: 'Gıda', city: 'Konya' },
    { name: 'ZahirTech', sector: 'Yazılım', city: 'İstanbul' },
  ]

  for (const company of companies) {
    const { data, error } = await supabase
      .from('Company')
      .insert([company])
      .select()
      .single()

    if (error) {
      console.error('Company insert error:', error)
      continue
    }

    seedData.companies.push(data)

    // Her şirket için 2 kullanıcı (1 admin + 1 sales) - SABİT EMAİL'LER (test için)
    // Şifre hepsi için: demo123
    const adminUser = {
      name: `${company.name} Admin`,
      email: `admin@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
      password: 'demo123', // AuthOptions demo123'ü kabul ediyor
      role: 'ADMIN',
      companyId: data.id,
    }

    const salesUser = {
      name: `${company.name} Sales`,
      email: `sales@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
      password: 'demo123', // AuthOptions demo123'ü kabul ediyor
      role: 'SALES',
      companyId: data.id,
    }
    
    console.log(`\n📧 ${company.name} için test kullanıcıları:`)
    console.log(`   Admin: ${adminUser.email} / demo123`)
    console.log(`   Sales: ${salesUser.email} / demo123`)

    const { data: admin, error: adminError } = await supabase
      .from('User')
      .insert([adminUser])
      .select()
      .single()

    if (adminError) {
      console.error(`❌ Admin user insert error for ${company.name}:`, adminError)
    }

    const { data: sales, error: salesError } = await supabase
      .from('User')
      .insert([salesUser])
      .select()
      .single()

    if (salesError) {
      console.error(`❌ Sales user insert error for ${company.name}:`, salesError)
    }

    if (admin) seedData.users.push(admin)
    if (sales) seedData.users.push(sales)

    // 10 Demo Customer
    const customers = Array.from({ length: 10 }, () => ({
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      city: faker.location.city(),
      status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE']),
      companyId: data.id,
    }))

    const { data: insertedCustomers } = await supabase
      .from('Customer')
      .insert(customers)
      .select()

    if (insertedCustomers) {
      seedData.customers.push(...insertedCustomers)
    }

    // 4 Demo Deal (LEAD → WON pipeline)
    const deals = [
      {
        title: 'Kütahya Ticaret Borsası Görüşmesi',
        stage: 'PROPOSAL',
        value: 25000,
        status: 'OPEN',
        companyId: data.id,
        customerId: insertedCustomers?.[0]?.id,
      },
      {
        title: 'Eskişehir Borsası Teklif',
        stage: 'NEGOTIATION',
        value: 35000,
        status: 'OPEN',
        companyId: data.id,
        customerId: insertedCustomers?.[1]?.id,
      },
      {
        title: 'Ankara Sağlık Kuruluşu',
        stage: 'WON',
        value: 50000,
        status: 'CLOSED',
        companyId: data.id,
        customerId: insertedCustomers?.[2]?.id,
      },
      {
        title: 'İzmir Gıda Firması',
        stage: 'LOST',
        value: 15000,
        status: 'CLOSED',
        companyId: data.id,
        customerId: insertedCustomers?.[3]?.id,
      },
    ]

    const { data: insertedDeals } = await supabase
      .from('Deal')
      .insert(deals)
      .select()

    if (insertedDeals) {
      seedData.deals.push(...insertedDeals)
    }

    // 6 Demo Quote (farklı statuslar, birbirine bağlı)
    const quotes = [
      {
        title: 'Teklif - Güneş Kuruyemiş',
        status: 'SENT',
        total: 15000,
        dealId: insertedDeals?.[0]?.id,
        companyId: data.id,
      },
      {
        title: 'Teklif - Eti Gıda',
        status: 'ACCEPTED',
        total: 48000,
        dealId: insertedDeals?.[1]?.id,
        companyId: data.id,
      },
      {
        title: 'Teklif - Eskişehir Borsası',
        status: 'WAITING',
        total: 27000,
        dealId: insertedDeals?.[1]?.id,
        companyId: data.id,
      },
      {
        title: 'Teklif - İmamoğlu Sağlık',
        status: 'DECLINED',
        total: 9000,
        dealId: insertedDeals?.[3]?.id,
        companyId: data.id,
      },
      {
        title: 'Teklif - Ankara Medikal',
        status: 'DRAFT',
        total: 32000,
        dealId: insertedDeals?.[2]?.id,
        companyId: data.id,
      },
      {
        title: 'Teklif - İstanbul Yazılım',
        status: 'SENT',
        total: 55000,
        dealId: insertedDeals?.[2]?.id,
        companyId: data.id,
      },
    ]

    const { data: insertedQuotes } = await supabase
      .from('Quote')
      .insert(quotes)
      .select()

    if (insertedQuotes) {
      seedData.quotes.push(...insertedQuotes)
    }

    // 5 Demo Invoice (PAID, OVERDUE, DRAFT, Quote'larla bağlı)
    const invoices = [
      {
        title: 'Fatura - Güneş Kuruyemiş',
        status: 'PAID',
        total: 15000,
        quoteId: insertedQuotes?.[0]?.id,
        companyId: data.id,
      },
      {
        title: 'Fatura - Eti Gıda',
        status: 'PAID',
        total: 48000,
        quoteId: insertedQuotes?.[1]?.id,
        companyId: data.id,
      },
      {
        title: 'Fatura - Eskişehir Borsası',
        status: 'OVERDUE',
        total: 27000,
        quoteId: insertedQuotes?.[2]?.id,
        companyId: data.id,
      },
      {
        title: 'Fatura - Ankara Medikal',
        status: 'DRAFT',
        total: 32000,
        quoteId: insertedQuotes?.[4]?.id,
        companyId: data.id,
      },
      {
        title: 'Fatura - İstanbul Yazılım',
        status: 'SENT',
        total: 55000,
        quoteId: insertedQuotes?.[5]?.id,
        companyId: data.id,
      },
    ]

    const { data: insertedInvoices } = await supabase
      .from('Invoice')
      .insert(invoices)
      .select()

    if (insertedInvoices) {
      seedData.invoices.push(...insertedInvoices)
    }

    // 10 Demo Product (stoklu/stoksuz)
    const products = Array.from({ length: 10 }, (_, i) => ({
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price({ min: 100, max: 10000 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      description: faker.commerce.productDescription(),
      companyId: data.id,
    }))

    const { data: insertedProducts } = await supabase
      .from('Product')
      .insert(products)
      .select()

    if (insertedProducts) {
      seedData.products.push(...insertedProducts)
    }

    // Finance gelir/gider örnekleri
    const finance = [
      {
        type: 'INCOME',
        amount: 15000,
        relatedTo: 'Invoice',
        companyId: data.id,
      },
      {
        type: 'INCOME',
        amount: 48000,
        relatedTo: 'Invoice',
        companyId: data.id,
      },
      {
        type: 'EXPENSE',
        amount: 5000,
        relatedTo: 'Office',
        companyId: data.id,
      },
      {
        type: 'EXPENSE',
        amount: 2000,
        relatedTo: 'Marketing',
        companyId: data.id,
      },
    ]

    const { data: insertedFinance } = await supabase
      .from('Finance')
      .insert(finance)
      .select()

    if (insertedFinance) {
      seedData.finance.push(...insertedFinance)
    }

    // 8 Demo ActivityLog (örnek kullanıcı hareketleri: create/edit/delete)
    const activityLogs = [
      {
        entity: 'Quote',
        action: 'CREATE',
        description: 'Yeni teklif oluşturuldu',
        meta: { entity: 'Quote', action: 'create', id: insertedQuotes?.[0]?.id },
        userId: admin?.id,
        companyId: data.id,
      },
      {
        entity: 'Invoice',
        action: 'PAYMENT',
        description: 'Fatura ödendi',
        meta: { entity: 'Invoice', action: 'payment', id: insertedInvoices?.[0]?.id },
        userId: admin?.id,
        companyId: data.id,
      },
      {
        entity: 'Deal',
        action: 'UPDATE',
        description: 'Fırsat güncellendi',
        meta: { entity: 'Deal', action: 'update', id: insertedDeals?.[0]?.id },
        userId: sales?.id,
        companyId: data.id,
      },
      {
        entity: 'Customer',
        action: 'CREATE',
        description: 'Yeni müşteri eklendi',
        meta: { entity: 'Customer', action: 'create', id: insertedCustomers?.[0]?.id },
        userId: admin?.id,
        companyId: data.id,
      },
      {
        entity: 'Quote',
        action: 'UPDATE',
        description: 'Teklif güncellendi',
        meta: { entity: 'Quote', action: 'update', id: insertedQuotes?.[1]?.id },
        userId: sales?.id,
        companyId: data.id,
      },
      {
        entity: 'Invoice',
        action: 'CREATE',
        description: 'Yeni fatura oluşturuldu',
        meta: { entity: 'Invoice', action: 'create', id: insertedInvoices?.[1]?.id },
        userId: admin?.id,
        companyId: data.id,
      },
      {
        entity: 'Deal',
        action: 'UPDATE',
        description: 'Fırsat durumu değiştirildi',
        meta: { entity: 'Deal', action: 'update', id: insertedDeals?.[1]?.id },
        userId: sales?.id,
        companyId: data.id,
      },
      {
        entity: 'Product',
        action: 'UPDATE',
        description: 'Ürün stok güncellendi',
        meta: { entity: 'Product', action: 'update', id: insertedProducts?.[0]?.id },
        userId: admin?.id,
        companyId: data.id,
      },
    ]

    const { data: insertedLogs } = await supabase
      .from('ActivityLog')
      .insert(activityLogs)
      .select()

    if (insertedLogs) {
      seedData.activityLogs.push(...insertedLogs)
    }
  }

  console.log('✅ Seed data başarıyla oluşturuldu!')
  console.log(`📊 ${seedData.companies.length} Company`)
  console.log(`👥 ${seedData.users.length} User`)
  console.log(`👤 ${seedData.customers.length} Customer`)
  console.log(`💼 ${seedData.deals.length} Deal`)
  console.log(`📄 ${seedData.quotes.length} Quote`)
  console.log(`🧾 ${seedData.invoices.length} Invoice`)
  console.log(`📦 ${seedData.products.length} Product`)
  console.log(`💰 ${seedData.finance.length} Finance`)
  console.log(`📝 ${seedData.activityLogs.length} ActivityLog`)

  return seedData
}

// Seed fonksiyonunu çalıştır
seedDatabase()
  .then(() => {
    console.log('✅ Seed tamamlandı!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed hatası:', error)
    process.exit(1)
  })
