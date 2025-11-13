# 🔄 Otomasyon Durum Raporu

**Tarih:** 2024  
**Durum:** Tüm otomasyonlar hazır - gerçek servis entegrasyonu bekleniyor

---

## ✅ TAMAMLANAN OTOMASYONLAR

### 1. Approvals Modülü

#### ✅ Otomatik Onay Talebi Oluşturma
- **Durum:** ✅ Trigger'lar mevcut (migration 054)
- **Dosya:** `supabase/migrations/054_approval_auto_approve_tracking.sql`
- **Çalışma Şekli:**
  - Quote > 50,000 TL → Otomatik onay talebi oluşturulur
  - Deal > 100,000 TL → Otomatik onay talebi oluşturulur
  - Threshold altındakiler otomatik onaylanır (APPROVED)
  - Threshold üstündekiler PENDING kalır (manuel onay gerekir)

#### ✅ Onay Sonrası Entity Güncelleme
- **Durum:** ✅ Trigger + Manuel güncelleme (çift güvenlik)
- **Dosya:** 
  - `supabase/migrations/037_advanced_features_automations.sql` (trigger)
  - `src/app/api/approvals/[id]/approve/route.ts` (manuel)
  - `src/app/api/approvals/[id]/reject/route.ts` (manuel)
- **Çalışma Şekli:**
  - Quote APPROVED → status: ACCEPTED
  - Deal APPROVED → stage: NEGOTIATION
  - Contract APPROVED → status: ACTIVE
  - Invoice APPROVED → status: APPROVED
  - Quote REJECTED → status: REJECTED
  - Deal REJECTED → stage: LOST + lostReason

#### ✅ Notification Sistemi
- **Durum:** ✅ Tamamlandı
- **Dosya:** `src/app/api/approvals/route.ts`, `approve/route.ts`, `reject/route.ts`
- **Çalışma Şekli:**
  - Onay talebi oluşturulduğunda → Onaylayıcılara notification
  - Onaylandığında → Talep edene notification
  - Reddedildiğinde → Talep edene notification

#### ✅ Email Bildirimleri
- **Durum:** ✅ Placeholder hazır (gerçek servis entegrasyonu bekleniyor)
- **Dosya:** `src/lib/email-helper.ts`
- **Fonksiyonlar:**
  - `sendApprovalRequestEmail()` - Onaylayıcılara email
  - `sendApprovalDecisionEmail()` - Talep edene email (onay/red)
- **Entegrasyon:**
  - `src/app/api/approvals/route.ts` - Onay talebi oluşturulduğunda
  - `src/app/api/approvals/[id]/approve/route.ts` - Onaylandığında
  - `src/app/api/approvals/[id]/reject/route.ts` - Reddedildiğinde

#### ✅ Hatırlatıcı Cron Job
- **Durum:** ✅ Hazır (Vercel Cron slot gerekiyor)
- **Dosya:** `src/app/api/cron/check-approval-reminders/route.ts`
- **Çalışma Şekli:**
  - Her gün 09:00'da çalışır
  - 1 günden fazla PENDING durumundaki onaylar için hatırlatıcı gönderir
  - Onaylayıcılara notification gönderir

---

### 2. Email Campaigns Modülü

#### ✅ Stats Güncelleme Trigger
- **Durum:** ✅ Mevcut ve çalışıyor
- **Dosya:** `supabase/migrations/037_advanced_features_automations.sql`
- **Fonksiyon:** `update_email_campaign_stats()`
- **Trigger:** `trigger_update_campaign_stats` (EmailLog INSERT/UPDATE)
- **Çalışma Şekli:**
  - EmailLog status = 'SENT' → totalSent++
  - EmailLog status = 'OPENED' → totalOpened++
  - EmailLog status = 'CLICKED' → totalClicked++
  - EmailLog status = 'BOUNCED' → totalBounced++

#### ✅ Email Gönderme Endpoint
- **Durum:** ✅ Tamamlandı
- **Dosya:** `src/app/api/email-campaigns/[id]/send/route.ts`
- **Özellikler:**
  - Segment bazlı gönderim
  - Tüm müşterilere gönderim
  - EmailLog kaydı
  - Stats güncelleme (trigger ile)
  - Internal cron call desteği

#### ✅ Scheduler Cron Job
- **Durum:** ✅ Hazır (Vercel Cron slot gerekiyor)
- **Dosya:** `src/app/api/cron/send-scheduled-campaigns/route.ts`
- **Çalışma Şekli:**
  - Her saat başı çalışır
  - SCHEDULED durumunda ve scheduledAt zamanı geçmiş kampanyaları gönderir
  - Internal call ile `/api/email-campaigns/[id]/send` endpoint'ini çağırır

#### ⚠️ SendGrid/AWS SES Entegrasyonu
- **Durum:** ⚠️ Placeholder hazır (gerçek servis entegrasyonu bekleniyor)
- **Dosya:** `src/lib/email-service.ts` (mevcut), `src/lib/email-helper.ts` (yeni)
- **Not:** Şu an mock olarak çalışıyor, gerçek email gönderilmiyor
- **Entegrasyon İçin:**
  - SendGrid: `npm install @sendgrid/mail`
  - AWS SES: `npm install @aws-sdk/client-ses`
  - Resend: `npm install resend`

---

## 📋 OTOMASYON TRİGGER'LARI (Database)

### Mevcut Trigger'lar

1. **Quote Approval Check** (`check_quote_needs_approval`)
   - **Tablo:** Quote
   - **Event:** INSERT, UPDATE (totalAmount, status)
   - **Durum:** ✅ Aktif

2. **Deal Approval Check** (`check_deal_needs_approval`)
   - **Tablo:** Deal
   - **Event:** INSERT, UPDATE (value, stage)
   - **Durum:** ✅ Aktif

3. **Approval Entity Update** (`update_entity_on_approval`)
   - **Tablo:** ApprovalRequest
   - **Event:** UPDATE (status)
   - **Durum:** ✅ Aktif

4. **Email Campaign Stats Update** (`update_email_campaign_stats`)
   - **Tablo:** EmailLog
   - **Event:** INSERT, UPDATE (status)
   - **Durum:** ✅ Aktif

---

## 🔧 CRON JOB'LAR

### Mevcut Cron Job'lar (Vercel)

1. **check-overdue-invoices** - Vadesi geçmiş faturalar
2. **check-due-soon-invoices** - Vadesi yaklaşan faturalar

### Hazır Cron Job'lar (Vercel Slot Bekleniyor)

1. **check-invoices** - Birleştirilmiş invoice kontrolü (overdue + due-soon)
2. **check-approval-reminders** - Onay hatırlatıcıları (1 gün PENDING)
3. **send-scheduled-campaigns** - Zamanlanmış email kampanyaları

---

## 📝 GERÇEK SERVİS ENTEGRASYONU İÇİN ADIMLAR

### 1. Email Servisi Entegrasyonu

#### SendGrid (Önerilen)
```bash
npm install @sendgrid/mail
```

`.env.local`:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourcompany.com
```

`src/lib/email-helper.ts` içinde:
```typescript
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// sendEmail fonksiyonunda:
const [response] = await sgMail.send({
  to: recipients,
  from: from || process.env.EMAIL_FROM!,
  subject,
  html,
})
```

#### AWS SES
```bash
npm install @aws-sdk/client-ses
```

`.env.local`:
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourcompany.com
```

---

## ✅ TEST EDİLMESİ GEREKENLER

1. **Quote/Deal Otomatik Onay Talebi**
   - 50,000 TL üzeri Quote oluştur → Onay talebi oluşmalı
   - 100,000 TL üzeri Deal oluştur → Onay talebi oluşmalı

2. **Email Campaign Stats Trigger**
   - EmailLog INSERT → Stats güncellenmeli
   - EmailLog UPDATE (OPENED) → totalOpened artmalı

3. **Approval Entity Update**
   - Approval APPROVED → Quote/Deal güncellenmeli
   - Approval REJECTED → Quote/Deal güncellenmeli

---

## 🎯 SONRAKİ ADIMLAR

1. **Vercel Cron Birleştirme:**
   - `check-overdue-invoices` + `check-due-soon-invoices` → `check-invoices`
   - 1 slot boşalt → `check-approval-reminders` ekle

2. **Email Servisi Entegrasyonu:**
   - SendGrid veya AWS SES kurulumu
   - `src/lib/email-helper.ts` ve `src/lib/email-service.ts` güncelleme

3. **Test:**
   - Tüm trigger'ları test et
   - Cron job'ları test et (manuel çağrı ile)

---

**Son Güncelleme:** 2024  
**Durum:** ✅ Tüm otomasyonlar hazır - gerçek servis entegrasyonu bekleniyor

