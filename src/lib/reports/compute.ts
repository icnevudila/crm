'use server'

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ReportContext {
  supabase: SupabaseClient
  companyId: string
  isSuperAdmin: boolean
}

interface DateRangeOptions {
  months: number
}

function getPastDateRange({ months }: DateRangeOptions) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date
}

function ensureMonthlyBuckets<T>(
  buckets: Record<string, T>,
  defaultValue: () => T,
  months = 12
) {
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!buckets[monthKey]) {
      buckets[monthKey] = defaultValue()
    }
  }
}

async function withCompanyFilter<T>(
  query: ReturnType<SupabaseClient['from']>,
  context: ReportContext,
  column: string = 'companyId'
) {
  if (context.isSuperAdmin) {
    return query
  }
  return query.eq(column, context.companyId)
}

export async function computeSalesReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let invoicesQuery = supabase
    .from('Invoice')
    .select('totalAmount, createdAt, status, companyId')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })

  invoicesQuery = context.isSuperAdmin ? invoicesQuery : invoicesQuery.eq('companyId', context.companyId)

  const { data: invoices, error } = await invoicesQuery

  if (error) {
    throw new Error(error.message)
  }

  const monthlyTrend: Record<string, number> = {}
  const monthlyComparison: Record<string, number> = {}
  const statusDistribution: Record<string, number> = {}

  invoices?.forEach((invoice: { createdAt: string; totalAmount?: number; status?: string }) => {
    const date = new Date(invoice.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const total = invoice.totalAmount || 0
    const status = invoice.status || 'UNKNOWN'

    if (status === 'PAID') {
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + total
      monthlyComparison[monthKey] = (monthlyComparison[monthKey] || 0) + total
    }

    statusDistribution[status] = (statusDistribution[status] || 0) + 1
  })

  ensureMonthlyBuckets(monthlyTrend, () => 0)
  ensureMonthlyBuckets(monthlyComparison, () => 0)

  return {
    monthlyTrend: Object.keys(monthlyTrend)
      .sort()
      .map((month) => ({
        month,
        total: monthlyTrend[month],
      })),
    monthlyComparison: Object.keys(monthlyComparison)
      .sort()
      .map((month) => ({
        month,
        total: monthlyComparison[month],
      })),
    statusDistribution: Object.keys(statusDistribution).map((status) => ({
      name: status,
      value: statusDistribution[status],
    })),
  }
}

export async function computeCustomerReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let customersQuery = supabase
    .from('Customer')
    .select('id, createdAt, sector, city')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(1000)

  customersQuery = context.isSuperAdmin ? customersQuery : customersQuery.eq('companyId', context.companyId)

  const { data: customers, error } = await customersQuery

  if (error) {
    throw new Error(error.message)
  }

  const growthTrend: Record<string, number> = {}
  const sectorDistribution: Record<string, number> = {}
  const cityDistribution: Record<string, number> = {}

  customers?.forEach((customer: { createdAt: string; sector?: string | null; city?: string | null }) => {
    const date = new Date(customer.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    growthTrend[monthKey] = (growthTrend[monthKey] || 0) + 1

    const sector = customer.sector || 'Belirtilmemiş'
    sectorDistribution[sector] = (sectorDistribution[sector] || 0) + 1

    const city = customer.city || 'Belirtilmemiş'
    cityDistribution[city] = (cityDistribution[city] || 0) + 1
  })

  ensureMonthlyBuckets(growthTrend, () => 0)

  return {
    growthTrend: Object.keys(growthTrend)
      .sort()
      .map((month) => ({
        month,
        count: growthTrend[month],
      })),
    sectorDistribution: Object.keys(sectorDistribution).map((sector) => ({
      name: sector,
      value: sectorDistribution[sector],
    })),
    cityDistribution: Object.keys(cityDistribution)
      .sort((a, b) => cityDistribution[b] - cityDistribution[a])
      .slice(0, 10)
      .map((city) => ({
        city,
        count: cityDistribution[city],
      })),
  }
}

export async function computeDealReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let dealsQuery = supabase
    .from('Deal')
    .select('id, stage, value, createdAt')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(1000)

  dealsQuery = context.isSuperAdmin ? dealsQuery : dealsQuery.eq('companyId', context.companyId)

  const { data: deals, error } = await dealsQuery

  if (error) {
    throw new Error(error.message)
  }

  const stageDistribution: Record<string, number> = {}
  const valueTrend: Record<string, { count: number; totalValue: number }> = {}

  deals?.forEach((deal: { stage?: string; value?: number | string; createdAt: string }) => {
    const date = new Date(deal.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const stage = deal.stage || 'UNKNOWN'
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1

    const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : deal.value || 0
    if (!valueTrend[monthKey]) {
      valueTrend[monthKey] = { count: 0, totalValue: 0 }
    }
    valueTrend[monthKey].count += 1
    valueTrend[monthKey].totalValue += dealValue
  })

  ensureMonthlyBuckets(valueTrend, () => ({ count: 0, totalValue: 0 }))

  return {
    stageDistribution: Object.keys(stageDistribution).map((stage) => ({
      stage,
      count: stageDistribution[stage],
    })),
    valueTrend: Object.keys(valueTrend)
      .sort()
      .map((month) => ({
        month,
        count: valueTrend[month].count,
        totalValue: valueTrend[month].totalValue,
      })),
  }
}

export async function computeQuoteReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let quotesQuery = supabase
    .from('Quote')
    .select('id, status, createdAt')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(1000)

  quotesQuery = context.isSuperAdmin ? quotesQuery : quotesQuery.eq('companyId', context.companyId)

  const { data: quotes, error } = await quotesQuery

  if (error) {
    throw new Error(error.message)
  }

  const statusDistribution: Record<string, number> = {}
  const trend: Record<string, number> = {}

  quotes?.forEach((quote: { status?: string; createdAt: string }) => {
    const date = new Date(quote.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const status = quote.status || 'UNKNOWN'
    statusDistribution[status] = (statusDistribution[status] || 0) + 1
    trend[monthKey] = (trend[monthKey] || 0) + 1
  })

  ensureMonthlyBuckets(trend, () => 0)

  return {
    statusDistribution: Object.keys(statusDistribution).map((status) => ({
      name: status,
      value: statusDistribution[status],
    })),
    trend: Object.keys(trend)
      .sort()
      .map((month) => ({
        month,
        count: trend[month],
      })),
  }
}

export async function computeInvoiceReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let invoicesQuery = supabase
    .from('Invoice')
    .select('id, status, createdAt')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(1000)

  invoicesQuery = context.isSuperAdmin ? invoicesQuery : invoicesQuery.eq('companyId', context.companyId)

  const { data: invoices, error } = await invoicesQuery

  if (error) {
    throw new Error(error.message)
  }

  const paymentDistribution: Record<string, number> = {}
  const monthlyTrend: Record<string, number> = {}

  invoices?.forEach((invoice: { status?: string; createdAt: string }) => {
    const date = new Date(invoice.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const status = invoice.status || 'UNKNOWN'
    paymentDistribution[status] = (paymentDistribution[status] || 0) + 1
    monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1
  })

  ensureMonthlyBuckets(monthlyTrend, () => 0)

  return {
    paymentDistribution: Object.keys(paymentDistribution).map((status) => ({
      status,
      count: paymentDistribution[status],
    })),
    monthlyTrend: Object.keys(monthlyTrend)
      .sort()
      .map((month) => ({
        month,
        count: monthlyTrend[month],
      })),
  }
}

export async function computeProductReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let productsQuery = supabase
    .from('Product')
    .select('id, name, price, stock')
    .order('price', { ascending: false })
    .limit(100)

  productsQuery = context.isSuperAdmin ? productsQuery : productsQuery.eq('companyId', context.companyId)

  const { data: products, error: productsError } = await productsQuery

  if (productsError) {
    throw new Error(productsError.message)
  }

  let invoiceItemsQuery = supabase
    .from('InvoiceItem')
    .select('productId, quantity, unitPrice, total, Invoice!inner(status, createdAt, companyId)')
    .eq('Invoice.status', 'PAID')
    .gte('Invoice.createdAt', twelveMonthsAgo.toISOString())
    .limit(5000)

  invoiceItemsQuery = context.isSuperAdmin
    ? invoiceItemsQuery
    : invoiceItemsQuery.eq('Invoice.companyId', context.companyId)

  const { data: invoiceItems, error: invoiceItemsError } = await invoiceItemsQuery

  if (invoiceItemsError) {
    throw new Error(invoiceItemsError.message)
  }

  const productSales: Record<
    string,
    { quantity: number; revenue: number; productName: string; price: number; stock: number }
  > = {}
  const monthlyGrowth: Record<string, number> = {}

  products?.forEach((product: any) => {
    productSales[product.id] = {
      quantity: 0,
      revenue: 0,
      productName: product.name,
      price: product.price || 0,
      stock: product.stock || 0,
    }
  })

  invoiceItems?.forEach((item: any) => {
    const productId = item.productId
    if (productSales[productId]) {
      const quantity = parseFloat(item.quantity) || 0
      const revenue = parseFloat(item.total) || quantity * (parseFloat(item.unitPrice) || 0)
      productSales[productId].quantity += quantity
      productSales[productId].revenue += revenue
      const invoiceCreatedAt = item.Invoice?.createdAt
      if (invoiceCreatedAt) {
        const date = new Date(invoiceCreatedAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + revenue
      }
    }
  })

  const topSellers = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((product) => ({
      name: product.productName,
      value: product.quantity,
      revenue: product.revenue,
      stock: product.stock,
    }))

  const performance = Object.values(productSales)
    .filter((p) => p.price > 0 && p.quantity > 0)
    .slice(0, 20)
    .map((product) => ({
      price: product.price,
      quantity: product.quantity,
      revenue: product.revenue,
      name: product.productName,
    }))

  ensureMonthlyBuckets(monthlyGrowth, () => 0)

  const growth = Object.keys(monthlyGrowth)
    .sort()
    .map((month) => ({
      month,
      revenue: monthlyGrowth[month],
    }))

  return {
    topSellers,
    performance,
    growth,
  }
}

export async function computeFinancialReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let financialQuery = supabase
    .from('Finance')
    .select('id, type, amount, createdAt, category')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(5000)

  financialQuery = context.isSuperAdmin ? financialQuery : financialQuery.eq('companyId', context.companyId)

  const { data: records, error } = await financialQuery

  if (error) {
    throw new Error(error.message)
  }

  const incomeExpense: Record<string, { income: number; expense: number }> = {}
  const categoryDistribution: Record<string, number> = {}

  records?.forEach((record: any) => {
    const date = new Date(record.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const amount = parseFloat(record.amount) || 0
    const category = record.category || record.type || 'OTHER'

    if (!incomeExpense[monthKey]) {
      incomeExpense[monthKey] = { income: 0, expense: 0 }
    }

    if ((record.type || '').toUpperCase() === 'INCOME') {
      incomeExpense[monthKey].income += amount
    } else {
      incomeExpense[monthKey].expense += amount
    }

    categoryDistribution[category] = (categoryDistribution[category] || 0) + amount
  })

  ensureMonthlyBuckets(incomeExpense, () => ({ income: 0, expense: 0 }))

  const monthlyIncomeExpense = Object.keys(incomeExpense)
    .sort()
    .map((month) => ({
      month,
      income: incomeExpense[month]?.income || 0,
      expense: incomeExpense[month]?.expense || 0,
    }))

  const categories = Object.keys(categoryDistribution).map((category) => ({
    category,
    value: categoryDistribution[category],
  }))

  return {
    incomeExpense: monthlyIncomeExpense,
    categoryDistribution: categories,
  }
}

export async function computePerformanceReport(context: ReportContext) {
  const { supabase } = context
  const threeMonthsAgo = getPastDateRange({ months: 3 })

  let performanceQuery = supabase
    .from('Task')
    .select('assignedTo, status, completedAt, createdAt')
    .gte('createdAt', threeMonthsAgo.toISOString())
    .limit(5000)

  performanceQuery = context.isSuperAdmin ? performanceQuery : performanceQuery.eq('companyId', context.companyId)

  const { data: tasks, error } = await performanceQuery

  if (error) {
    throw new Error(error.message)
  }

  const teamPerformance: Record<string, { completed: number; total: number }> = {}
  const userPerformance: Record<string, { completed: number; total: number }> = {}
  const goalAchievement: Record<string, { completed: number; total: number }> = {}

  tasks?.forEach((task: any) => {
    const assignee = task.assignedTo || 'UNASSIGNED'
    const status = (task.status || '').toUpperCase()
    const createdDate = new Date(task.createdAt)
    const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`

    if (!teamPerformance[assignee]) {
      teamPerformance[assignee] = { completed: 0, total: 0 }
    }
    if (!userPerformance[assignee]) {
      userPerformance[assignee] = { completed: 0, total: 0 }
    }
    if (!goalAchievement[monthKey]) {
      goalAchievement[monthKey] = { completed: 0, total: 0 }
    }

    teamPerformance[assignee].total += 1
    userPerformance[assignee].total += 1
    goalAchievement[monthKey].total += 1

    if (status === 'DONE' || status === 'COMPLETED') {
      teamPerformance[assignee].completed += 1
      userPerformance[assignee].completed += 1
      goalAchievement[monthKey].completed += 1
    }
  })

  return {
    teamPerformance: Object.keys(teamPerformance).map((team) => ({
      team,
      completed: teamPerformance[team].completed,
      total: teamPerformance[team].total,
    })),
    userPerformance: Object.keys(userPerformance).map((user) => ({
      user,
      completed: userPerformance[user].completed,
      total: userPerformance[user].total,
    })),
    goalAchievement: Object.keys(goalAchievement)
      .sort()
      .map((month) => ({
        month,
        completed: goalAchievement[month].completed,
        total: goalAchievement[month].total,
      })),
  }
}

export async function computeTimeReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let activityQuery = supabase
    .from('ActivityLog')
    .select('id, createdAt, type')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(5000)

  activityQuery = context.isSuperAdmin ? activityQuery : activityQuery.eq('companyId', context.companyId)

  const { data: activities, error } = await activityQuery

  if (error) {
    throw new Error(error.message)
  }

  const dailyTrend: Record<string, number> = {}
  const weeklyComparison: Record<string, number> = {}
  const yearlySummary: Record<string, number> = {}

  activities?.forEach((activity: any) => {
    const date = new Date(activity.createdAt)
    const dayKey = date.toISOString().split('T')[0]
    const weekKey = `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`
    const yearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    dailyTrend[dayKey] = (dailyTrend[dayKey] || 0) + 1
    weeklyComparison[weekKey] = (weeklyComparison[weekKey] || 0) + 1
    yearlySummary[yearKey] = (yearlySummary[yearKey] || 0) + 1
  })

  return {
    dailyTrend: Object.keys(dailyTrend)
      .sort()
      .map((day) => ({
        day,
        count: dailyTrend[day],
      })),
    weeklyComparison: Object.keys(weeklyComparison)
      .sort()
      .map((week) => ({
        week,
        count: weeklyComparison[week],
      })),
    yearlySummary: Object.keys(yearlySummary)
      .sort()
      .map((month) => ({
        month,
        count: yearlySummary[month],
      })),
  }
}

function getWeekNumber(date: Date) {
  const firstJan = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstJan.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7)
}

export async function computeSectorReport(context: ReportContext) {
  const { supabase } = context
  const twelveMonthsAgo = getPastDateRange({ months: 12 })

  let customerQuery = supabase
    .from('Customer')
    .select('id, sector, estimatedRevenue, createdAt')
    .gte('createdAt', twelveMonthsAgo.toISOString())
    .order('createdAt', { ascending: true })
    .limit(5000)

  customerQuery = context.isSuperAdmin ? customerQuery : customerQuery.eq('companyId', context.companyId)

  const { data: customers, error } = await customerQuery

  if (error) {
    throw new Error(error.message)
  }

  const customerDistribution: Record<string, number> = {}
  const profitability: Record<string, number> = {}
  const salesPerformance: Record<string, number> = {}

  customers?.forEach((customer: any) => {
    const sector = customer.sector || 'OTHER'
    const revenue = parseFloat(customer.estimatedRevenue) || 0

    customerDistribution[sector] = (customerDistribution[sector] || 0) + 1
    profitability[sector] = (profitability[sector] || 0) + revenue
    salesPerformance[sector] = (salesPerformance[sector] || 0) + revenue
  })

  return {
    customerDistribution: Object.keys(customerDistribution).map((sector) => ({
      sector,
      value: customerDistribution[sector],
    })),
    profitability: Object.keys(profitability).map((sector) => ({
      sector,
      value: profitability[sector],
    })),
    salesPerformance: Object.keys(salesPerformance).map((sector) => ({
      sector,
      value: salesPerformance[sector],
    })),
  }
}

