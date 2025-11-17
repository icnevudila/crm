# 🚀 CRM Enterprise V3 - Ay 1-2-3 Implementasyon Planı

**Tarih:** 2024  
**Durum:** 📋 Planlama Aşaması

---

## 📅 AY 1: TEMEL İYİLEŞTİRMELER

### 1. 📧 EMAIL ENTEGRASYONU

#### 1.1. Mevcut Durum
- ✅ Resend paketi kurulu (`package.json`)
- ✅ `src/lib/email-service.ts` var ama mock modda
- ✅ `src/lib/template-renderer.ts` var
- ✅ Email templates tablosu var (`EmailTemplate`)
- ✅ Email campaigns tablosu var (`EmailCampaign`)

#### 1.2. Yapılacaklar

**Adım 1: Resend Entegrasyonunu Aktif Et**
```typescript
// src/lib/email-service.ts güncellemesi
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailOptions): Promise<EmailServiceResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    const { data, error } = await resend.emails.send({
      from: from || process.env.SMTP_FROM || 'noreply@yourcompany.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to: replyTo,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error: any) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error.message || 'Email gönderilemedi',
    }
  }
}
```

**Adım 2: Gmail/Outlook OAuth Entegrasyonu**
```typescript
// src/lib/integrations/gmail.ts
import { google } from 'googleapis'

export async function sendGmailEmail({
  accessToken,
  refreshToken,
  to,
  subject,
  html,
}: {
  accessToken: string
  refreshToken: string
  to: string
  subject: string
  html: string
}) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
    '',
    html,
  ].join('\n')

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  })

  return response.data
}
```

**Adım 3: Email Thread Tracking**
```sql
-- Migration: EmailThread tablosu
CREATE TABLE "EmailThread" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "relatedTo" TEXT NOT NULL, -- 'Customer', 'Deal', 'Quote', etc.
  "relatedId" UUID NOT NULL,
  "threadId" TEXT NOT NULL, -- Gmail thread ID
  "subject" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "messageCount" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emailthread_company ON "EmailThread"("companyId");
CREATE INDEX idx_emailthread_related ON "EmailThread"("relatedTo", "relatedId");
CREATE INDEX idx_emailthread_thread ON "EmailThread"("threadId");
```

**Adım 4: Email Sync API**
```typescript
// src/app/api/integrations/email/sync/route.ts
export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider, accessToken, refreshToken } = await request.json()

  // Gmail sync
  if (provider === 'gmail') {
    const emails = await syncGmailEmails({
      accessToken,
      refreshToken,
      companyId: session.user.companyId,
    })
    return NextResponse.json({ success: true, emails })
  }

  // Outlook sync
  if (provider === 'outlook') {
    const emails = await syncOutlookEmails({
      accessToken,
      refreshToken,
      companyId: session.user.companyId,
    })
    return NextResponse.json({ success: true, emails })
  }

  return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
}
```

**Tahmini Süre:** 8-10 saat

---

### 2. 📅 CALENDAR ENTEGRASYONU

#### 2.1. Mevcut Durum
- ✅ `src/app/api/integrations/calendar/` klasörü var
- ✅ `AddToCalendarButton` component'i var
- ❌ İki yönlü sync yok
- ❌ Meeting reminders yok

#### 2.2. Yapılacaklar

**Adım 1: Google Calendar OAuth**
```typescript
// src/lib/integrations/google-calendar.ts
import { google } from 'googleapis'

export async function createCalendarEvent({
  accessToken,
  refreshToken,
  summary,
  description,
  startTime,
  endTime,
  location,
  attendees,
}: {
  accessToken: string
  refreshToken: string
  summary: string
  description: string
  startTime: string
  endTime: string
  location?: string
  attendees?: string[]
}) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone: 'Europe/Istanbul',
    },
    end: {
      dateTime: endTime,
      timeZone: 'Europe/Istanbul',
    },
    location,
    attendees: attendees?.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 gün önce
        { method: 'popup', minutes: 60 }, // 1 saat önce
      ],
    },
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  })

  return response.data
}
```

**Adım 2: Calendar Sync (İki Yönlü)**
```typescript
// src/app/api/integrations/calendar/sync/route.ts
export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider, accessToken, refreshToken, direction } = await request.json()

  // CRM → Calendar (Meeting'leri Calendar'a gönder)
  if (direction === 'crm-to-calendar') {
    const meetings = await getMeetingsForSync(session.user.companyId)
    
    for (const meeting of meetings) {
      await createCalendarEvent({
        accessToken,
        refreshToken,
        summary: meeting.title,
        description: meeting.description || '',
        startTime: meeting.meetingDate,
        endTime: new Date(new Date(meeting.meetingDate).getTime() + 60 * 60 * 1000).toISOString(),
        location: meeting.location || '',
      })
    }
  }

  // Calendar → CRM (Calendar'daki event'leri CRM'e çek)
  if (direction === 'calendar-to-crm') {
    const events = await getCalendarEvents({
      accessToken,
      refreshToken,
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    for (const event of events) {
      await createMeetingFromCalendarEvent({
        event,
        companyId: session.user.companyId,
        userId: session.user.id,
      })
    }
  }

  return NextResponse.json({ success: true })
}
```

**Adım 3: Meeting Reminders**
```sql
-- Migration: MeetingReminder tablosu
CREATE TABLE "MeetingReminder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "meetingId" UUID NOT NULL REFERENCES "Meeting"(id) ON DELETE CASCADE,
  "reminderType" TEXT NOT NULL, -- 'EMAIL', 'SMS', 'PUSH'
  "reminderTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "sent" BOOLEAN DEFAULT FALSE,
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meetingreminder_meeting ON "MeetingReminder"("meetingId");
CREATE INDEX idx_meetingreminder_time ON "MeetingReminder"("reminderTime") WHERE "sent" = FALSE;
```

```typescript
// src/app/api/cron/check-meeting-reminders/route.ts
export async function GET(request: Request) {
  // Cron job - Her 5 dakikada bir çalışır
  const supabase = getSupabaseWithServiceRole()
  
  const now = new Date()
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)

  const { data: reminders } = await supabase
    .from('MeetingReminder')
    .select(`
      *,
      Meeting (
        id,
        title,
        meetingDate,
        Customer (email, name),
        User (email, name)
      )
    `)
    .eq('sent', false)
    .gte('reminderTime', now.toISOString())
    .lte('reminderTime', fiveMinutesLater.toISOString())

  for (const reminder of reminders || []) {
    if (reminder.reminderType === 'EMAIL') {
      await sendEmail({
        to: reminder.Meeting.User.email,
        subject: `Hatırlatma: ${reminder.Meeting.title}`,
        html: `
          <h2>Toplantı Hatırlatması</h2>
          <p><strong>Toplantı:</strong> ${reminder.Meeting.title}</p>
          <p><strong>Tarih:</strong> ${new Date(reminder.Meeting.meetingDate).toLocaleString('tr-TR')}</p>
          <p><strong>Müşteri:</strong> ${reminder.Meeting.Customer.name}</p>
        `,
      })
    }

    await supabase
      .from('MeetingReminder')
      .update({ sent: true, sentAt: new Date().toISOString() })
      .eq('id', reminder.id)
  }

  return NextResponse.json({ success: true, sent: reminders?.length || 0 })
}
```

**Tahmini Süre:** 6-8 saat

---

### 3. 📊 ADVANCED REPORTING

#### 3.1. Mevcut Durum
- ✅ `src/app/[locale]/reports/page.tsx` var
- ✅ Temel raporlar var (Sales, Customer, Deal, Quote)
- ❌ Custom report builder yok
- ❌ Report scheduling yok

#### 3.2. Yapılacaklar

**Adım 1: Custom Report Builder Component**
```typescript
// src/components/reports/CustomReportBuilder.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ReportField {
  id: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  table: string
  column: string
}

interface ReportFilter {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: any
}

interface CustomReport {
  name: string
  description: string
  fields: ReportField[]
  filters: ReportFilter[]
  groupBy?: string
  orderBy?: string
  chartType?: 'table' | 'bar' | 'line' | 'pie'
}

export default function CustomReportBuilder() {
  const [report, setReport] = useState<CustomReport>({
    name: '',
    description: '',
    fields: [],
    filters: [],
  })

  const availableFields: ReportField[] = [
    { id: 'customer-name', label: 'Müşteri Adı', type: 'string', table: 'Customer', column: 'name' },
    { id: 'deal-value', label: 'Fırsat Değeri', type: 'number', table: 'Deal', column: 'value' },
    { id: 'quote-total', label: 'Teklif Toplamı', type: 'number', table: 'Quote', column: 'totalAmount' },
    { id: 'invoice-date', label: 'Fatura Tarihi', type: 'date', table: 'Invoice', column: 'createdAt' },
    // ... daha fazla alan
  ]

  const handleSaveReport = async () => {
    const res = await fetch('/api/reports/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })

    if (res.ok) {
      alert('Rapor kaydedildi!')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Özel Rapor Oluştur</h2>
      
      <div className="space-y-4">
        <div>
          <Label>Rapor Adı</Label>
          <Input
            value={report.name}
            onChange={(e) => setReport({ ...report, name: e.target.value })}
          />
        </div>

        <div>
          <Label>Alanlar</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {availableFields.map((field) => (
              <div key={field.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={report.fields.some(f => f.id === field.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setReport({ ...report, fields: [...report.fields, field] })
                    } else {
                      setReport({ ...report, fields: report.fields.filter(f => f.id !== field.id) })
                    }
                  }}
                />
                <Label>{field.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSaveReport}>Raporu Kaydet</Button>
      </div>
    </Card>
  )
}
```

**Adım 2: Custom Report API**
```typescript
// src/app/api/reports/custom/route.ts
export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await request.json()
  const supabase = getSupabaseWithServiceRole()

  // Custom report'u kaydet
  const { data, error } = await supabase
    .from('CustomReport')
    .insert({
      name: report.name,
      description: report.description,
      fields: report.fields,
      filters: report.filters,
      groupBy: report.groupBy,
      orderBy: report.orderBy,
      chartType: report.chartType,
      companyId: session.user.companyId,
      createdBy: session.user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('CustomReport')
    .select('*')
    .eq('companyId', session.user.companyId)
    .order('createdAt', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

**Adım 3: Report Scheduling**
```sql
-- Migration: ScheduledReport tablosu
CREATE TABLE "ScheduledReport" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reportId" UUID NOT NULL REFERENCES "CustomReport"(id) ON DELETE CASCADE,
  "scheduleType" TEXT NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY'
  "scheduleTime" TEXT NOT NULL, -- '09:00'
  "scheduleDay" INTEGER, -- 1-7 (Monday-Sunday) for WEEKLY
  "scheduleDate" INTEGER, -- 1-31 for MONTHLY
  "recipients" TEXT[] NOT NULL, -- Email listesi
  "lastSentAt" TIMESTAMP WITH TIME ZONE,
  "nextSendAt" TIMESTAMP WITH TIME ZONE,
  "active" BOOLEAN DEFAULT TRUE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduledreport_nextsend ON "ScheduledReport"("nextSendAt") WHERE "active" = TRUE;
```

**Tahmini Süre:** 10-12 saat

---

## 📅 AY 2-3: GELİŞMİŞ ÖZELLİKLER

### 4. 🔄 WORKFLOW AUTOMATION

#### 4.1. Mevcut Durum
- ✅ Bazı otomasyonlar var (cron jobs)
- ❌ Visual workflow builder yok
- ❌ Conditional logic yok

#### 4.2. Yapılacaklar

**Adım 1: Workflow Tablosu**
```sql
-- Migration: Workflow tablosu
CREATE TABLE "Workflow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "triggerType" TEXT NOT NULL, -- 'EVENT', 'SCHEDULE', 'WEBHOOK'
  "triggerConfig" JSONB NOT NULL,
  "steps" JSONB NOT NULL, -- Workflow adımları
  "active" BOOLEAN DEFAULT TRUE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflow_company ON "Workflow"("companyId");
CREATE INDEX idx_workflow_active ON "Workflow"("active") WHERE "active" = TRUE;
```

**Adım 2: Visual Workflow Builder**
```typescript
// src/components/workflow/WorkflowBuilder.tsx
'use client'

import { useState } from 'react'
import { ReactFlow, Node, Edge, addEdge, Connection } from 'reactflow'
import 'reactflow/dist/style.css'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  config: any
}

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const onConnect = (params: Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: type },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const saveWorkflow = async () => {
    const workflow = {
      name: 'Yeni Workflow',
      triggerType: 'EVENT',
      triggerConfig: {},
      steps: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        config: node.data.config,
      })),
    }

    await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    })
  }

  return (
    <div className="h-screen">
      <div className="flex gap-4 p-4">
        <Button onClick={() => addNode('trigger')}>Trigger Ekle</Button>
        <Button onClick={() => addNode('condition')}>Condition Ekle</Button>
        <Button onClick={() => addNode('action')}>Action Ekle</Button>
        <Button onClick={saveWorkflow}>Kaydet</Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={(changes) => {
          // Node değişikliklerini handle et
        }}
        onEdgesChange={(changes) => {
          // Edge değişikliklerini handle et
        }}
      />
    </div>
  )
}
```

**Adım 3: Workflow Engine**
```typescript
// src/lib/workflow-engine.ts
export async function executeWorkflow(workflowId: string, triggerData: any) {
  const workflow = await getWorkflow(workflowId)
  if (!workflow || !workflow.active) {
    return
  }

  for (const step of workflow.steps) {
    if (step.type === 'condition') {
      const conditionResult = await evaluateCondition(step.config, triggerData)
      if (!conditionResult) {
        continue // Skip this branch
      }
    } else if (step.type === 'action') {
      await executeAction(step.config, triggerData)
    } else if (step.type === 'delay') {
      await delay(step.config.duration)
    }
  }
}

async function evaluateCondition(config: any, data: any): Promise<boolean> {
  const { field, operator, value } = config
  
  switch (operator) {
    case 'equals':
      return data[field] === value
    case 'contains':
      return String(data[field]).includes(String(value))
    case 'greaterThan':
      return Number(data[field]) > Number(value)
    default:
      return false
  }
}

async function executeAction(config: any, data: any) {
  const { type, params } = config

  switch (type) {
    case 'sendEmail':
      await sendEmail({
        to: params.to,
        subject: params.subject,
        html: params.body,
      })
      break
    case 'createTask':
      await createTask({
        title: params.title,
        description: params.description,
        assignedTo: params.assignedTo,
      })
      break
    case 'updateDeal':
      await updateDeal(params.dealId, params.updates)
      break
  }
}
```

**Tahmini Süre:** 15-20 saat

---

### 5. 📊 CUSTOM REPORT BUILDER (Detaylı)

**Adım 1: Report Query Builder**
```typescript
// src/lib/report-query-builder.ts
export function buildReportQuery(report: CustomReport) {
  let query = supabase
    .from(report.fields[0].table)
    .select(report.fields.map(f => `${f.table}.${f.column}`).join(', '))

  // Filters
  for (const filter of report.filters) {
    const field = report.fields.find(f => f.id === filter.field)
    if (!field) continue

    switch (filter.operator) {
      case 'equals':
        query = query.eq(`${field.table}.${field.column}`, filter.value)
        break
      case 'contains':
        query = query.ilike(`${field.table}.${field.column}`, `%${filter.value}%`)
        break
      case 'greaterThan':
        query = query.gt(`${field.table}.${field.column}`, filter.value)
        break
    }
  }

  // Group By
  if (report.groupBy) {
    // Supabase'de group by için aggregation kullan
    query = query.select(`${report.groupBy}, count(*)`)
  }

  // Order By
  if (report.orderBy) {
    query = query.order(report.orderBy, { ascending: report.orderBy.startsWith('-') })
  }

  return query
}
```

**Tahmini Süre:** 8-10 saat

---

### 6. 🔍 DATA QUALITY TOOLS

#### 6.1. Mevcut Durum
- ✅ `src/app/api/customers/duplicates/route.ts` var
- ❌ Otomatik duplicate detection yok
- ❌ Data enrichment yok

#### 6.2. Yapılacaklar

**Adım 1: Otomatik Duplicate Detection**
```typescript
// src/app/api/cron/check-duplicates/route.ts
export async function GET(request: Request) {
  const supabase = getSupabaseWithServiceRole()

  // Tüm müşterileri al
  const { data: customers } = await supabase
    .from('Customer')
    .select('id, name, email, phone, companyId')

  const duplicates: Array<{ customer1: any; customer2: any; score: number }> = []

  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const score = calculateSimilarity(customers[i], customers[j])
      if (score > 0.8) {
        duplicates.push({
          customer1: customers[i],
          customer2: customers[j],
          score,
        })
      }
    }
  }

  // Duplicate'leri kaydet
  for (const dup of duplicates) {
    await supabase.from('DuplicateRecord').upsert({
      recordType: 'Customer',
      recordId1: dup.customer1.id,
      recordId2: dup.customer2.id,
      similarityScore: dup.score,
      companyId: dup.customer1.companyId,
    })
  }

  return NextResponse.json({ success: true, duplicates: duplicates.length })
}

function calculateSimilarity(customer1: any, customer2: any): number {
  let score = 0
  let maxScore = 0

  // Email match
  if (customer1.email && customer2.email) {
    maxScore += 0.4
    if (customer1.email.toLowerCase() === customer2.email.toLowerCase()) {
      score += 0.4
    }
  }

  // Phone match
  if (customer1.phone && customer2.phone) {
    maxScore += 0.3
    const phone1 = customer1.phone.replace(/\D/g, '')
    const phone2 = customer2.phone.replace(/\D/g, '')
    if (phone1 === phone2) {
      score += 0.3
    }
  }

  // Name similarity
  if (customer1.name && customer2.name) {
    maxScore += 0.3
    const similarity = stringSimilarity(customer1.name, customer2.name)
    score += similarity * 0.3
  }

  return maxScore > 0 ? score / maxScore : 0
}
```

**Adım 2: Data Enrichment**
```typescript
// src/lib/data-enrichment.ts
export async function enrichCustomerData(customerId: string) {
  const customer = await getCustomer(customerId)
  
  // Clearbit API (örnek)
  if (customer.email) {
    const domain = customer.email.split('@')[1]
    const companyData = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${domain}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`,
      },
    }).then(res => res.json())

    if (companyData) {
      await updateCustomer(customerId, {
        website: companyData.website,
        industry: companyData.category?.industry,
        employees: companyData.metrics?.employees,
        // ... daha fazla alan
      })
    }
  }
}
```

**Adım 3: Data Validation Rules**
```sql
-- Migration: DataValidationRule tablosu
CREATE TABLE "DataValidationRule" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "tableName" TEXT NOT NULL,
  "columnName" TEXT NOT NULL,
  "ruleType" TEXT NOT NULL, -- 'REQUIRED', 'FORMAT', 'RANGE', 'UNIQUE'
  "ruleConfig" JSONB NOT NULL,
  "errorMessage" TEXT NOT NULL,
  "active" BOOLEAN DEFAULT TRUE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Tahmini Süre:** 10-12 saat

---

## 📦 GEREKLİ PAKETLER

```bash
# Email
npm install resend  # ✅ Zaten kurulu

# Calendar
npm install googleapis  # Google Calendar için
npm install @microsoft/microsoft-graph-client  # Outlook için

# Workflow
npm install reactflow  # Visual workflow builder için

# Data Quality
npm install string-similarity  # String benzerlik hesaplama
```

---

## 🎯 ÖNCELİK SIRASI

### Hafta 1-2: Email Entegrasyonu
1. Resend aktif et
2. Gmail/Outlook OAuth
3. Email thread tracking

### Hafta 3-4: Calendar Entegrasyonu
1. Google Calendar sync
2. Meeting reminders
3. İki yönlü sync

### Hafta 5-6: Advanced Reporting
1. Custom report builder
2. Report scheduling
3. Report templates

### Hafta 7-10: Workflow Automation
1. Workflow tablosu
2. Visual builder
3. Workflow engine

### Hafta 11-12: Data Quality
1. Duplicate detection
2. Data enrichment
3. Validation rules

---

## 💰 MALİYET TAHMİNİ

- **Resend:** $20/ay (10,000 email)
- **Google API:** Ücretsiz (quota içinde)
- **Clearbit:** $99/ay (starter plan)
- **Toplam:** ~$120/ay

---

## ✅ CHECKLIST

### Email Entegrasyonu
- [ ] Resend API key ekle
- [ ] Email service aktif et
- [ ] Gmail OAuth kurulumu
- [ ] Outlook OAuth kurulumu
- [ ] Email thread tracking
- [ ] Email sync API

### Calendar Entegrasyonu
- [ ] Google Calendar API kurulumu
- [ ] Outlook Calendar API kurulumu
- [ ] İki yönlü sync
- [ ] Meeting reminders
- [ ] Reminder cron job

### Advanced Reporting
- [ ] Custom report builder UI
- [ ] Report query builder
- [ ] Report scheduling
- [ ] Report templates

### Workflow Automation
- [ ] Workflow tablosu
- [ ] Visual builder component
- [ ] Workflow engine
- [ ] Trigger system

### Data Quality
- [ ] Duplicate detection
- [ ] Merge functionality
- [ ] Data enrichment
- [ ] Validation rules

---

**Toplam Tahmini Süre:** 60-70 saat  
**Toplam Tahmini Maliyet:** ~$120/ay



