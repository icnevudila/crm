# 🚀 Vercel Deploy Edilmemiş Migration'lar

## 📋 Çalıştırılacak Migration Dosyaları (Sırayla)

### ⚠️ ÖNEMLİ: Contact Tablosu Hatası İçin
**Migration 033** - Contact tablosunu oluşturur (firma yetkilileri hatası için gerekli)

```
supabase/migrations/033_contact_lead_scoring_improvements.sql
```

**Ne yapar:**
- `Contact` tablosunu oluşturur (CustomerCompany'ye bağlı kişiler)
- Lead scoring sistemini geliştirir
- Deal stage history ekler
- Quote versioning ekler
- Meeting notes ekler

---

### 📦 Diğer Önemli Migration'lar

#### 1. Migration 101-118 (Yeni Özellikler)
```
101_add_contact_image_url.sql
102_add_missing_modules.sql
103_add_meeting_integrations.sql
104_add_company_integrations.sql
105_add_email_integrations.sql
106_complete_module_relationships.sql
107_user_automation_preferences.sql
108_add_google_calendar_integration.sql
109_partial_payment_and_stock_reservation.sql
110_detail_pages_missing_fields.sql
111_add_created_by_updated_by_columns.sql
112_sales_badges_and_streaks.sql
113_team_chat_system.sql
114_complete_new_features.sql
115_fix_duplicate_stock_zero_notifications.sql
116_recurring_meetings.sql
117_push_subscriptions.sql
118_sevk_analizleri_xml.sql
```

#### 2. Migration 999 (Resend Email)
```
999_add_resend_enabled.sql
```

---

## 🔧 Nasıl Çalıştırılır?

### Adım 1: Supabase Dashboard'a Git
1. https://supabase.com/dashboard
2. Projenizi seçin
3. **SQL Editor** sekmesine gidin

### Adım 2: Migration Dosyasını Çalıştır
1. `supabase/migrations/033_contact_lead_scoring_improvements.sql` dosyasını açın
2. **Tüm içeriği** kopyalayın
3. SQL Editor'a yapıştırın
4. **RUN** butonuna tıklayın

### Adım 3: Kontrol Et
```sql
-- Contact tablosu oluşturuldu mu?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'Contact';
```

**Beklenen sonuç:** 1 satır (Contact tablosu)

---

## ⚡ Hızlı Çalıştırma (Tüm Migration'lar)

Eğer tüm migration'ları sırayla çalıştırmak isterseniz:

1. **Migration 033** (Contact tablosu - ÖNCE BU!)
2. **Migration 101-118** (Yeni özellikler)
3. **Migration 999** (Resend email)

---

## 🐛 Hata Durumunda

Eğer bir migration hata verirse:
1. Hata mesajını not edin
2. Hangi satırda hata olduğunu kontrol edin
3. SQL Editor'da o satırı düzeltin veya atlayın
4. Tekrar çalıştırın

---

## ✅ Migration Sonrası Test

```sql
-- Contact tablosu kontrolü
SELECT COUNT(*) FROM "Contact";

-- Contact kolonları kontrolü
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Contact'
ORDER BY ordinal_position;
```

---

**Not:** Migration'ları sırayla çalıştırın. Her migration bir öncekine bağımlı olabilir.

