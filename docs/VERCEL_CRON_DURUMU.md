# Vercel Cron Durum Raporu

## 📊 Mevcut Durum

**Vercel Cron Limit:** 2 slot (Hobby plan)
**Kullanılan Slot:** 2/2 (100% dolu)

### Mevcut Cron Job'lar

1. **check-overdue-invoices**
   - Path: `/api/cron/check-overdue-invoices`
   - Schedule: `0 9 * * *` (Her gün sabah 09:00)
   - Amaç: Vadesi geçmiş faturaları kontrol eder ve bildirim gönderir

2. **check-due-soon-invoices**
   - Path: `/api/cron/check-due-soon-invoices`
   - Schedule: `0 9 * * *` (Her gün sabah 09:00)
   - Amaç: Vadesi yaklaşan faturaları kontrol eder ve bildirim gönderir

---

## ⚠️ Yeni Cron Job Eklenemez

Vercel Cron limiti dolduğu için yeni cron job eklenemez. Alternatif çözümler:

### 1. Mevcut Cron Job'ları Birleştirme (Önerilen)

Mevcut 2 cron job'ı tek bir endpoint'te birleştirerek 1 slot boşaltılabilir:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-invoices",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/check-approval-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Avantajlar:**
- 1 slot boşalır
- Yeni cron job eklenebilir (örn: approval reminders)
- Kod tekrarı azalır

### 2. Supabase pg_cron Kullanma

Supabase'de `pg_cron` extension'ı kullanarak database-level cron job'lar oluşturulabilir:

```sql
-- pg_cron extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Approval reminder cron job
SELECT cron.schedule(
  'approval-reminders',
  '0 9 * * *', -- Her gün sabah 09:00
  $$
  SELECT notify_pending_approvals();
  $$
);
```

**Avantajlar:**
- Vercel Cron limiti kullanılmaz
- Database-level çalışır (daha hızlı)
- Trigger'lar ve fonksiyonlar ile entegre

**Dezavantajlar:**
- Supabase Pro plan gerektirebilir
- Database yükü artar

### 3. External Cron Service Kullanma

Üçüncü parti cron servisleri kullanılabilir:
- **Cron-job.org** (ücretsiz)
- **EasyCron** (ücretsiz plan)
- **GitHub Actions** (ücretsiz, public repo için)

**Örnek GitHub Actions:**
```yaml
# .github/workflows/cron.yml
name: Approval Reminders
on:
  schedule:
    - cron: '0 9 * * *' # Her gün sabah 09:00
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/check-approval-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_TOKEN }}"
```

---

## 🎯 Önerilen Aksiyon Planı

### Kısa Vadeli (Hemen)
1. ✅ Mevcut 2 cron job'ı birleştir → 1 slot boşalt
2. ✅ Approval reminder cron job ekle (1 slot kullan)

### Orta Vadeli (Gelecek)
1. Supabase pg_cron'a geçiş yap (Vercel Cron'dan bağımsız)
2. Tüm scheduled job'ları Supabase'e taşı

### Uzun Vadeli (İleride)
1. Vercel Pro plan'a geçiş (daha fazla cron slot)
2. Veya external cron service entegrasyonu

---

## 📝 Notlar

- **Vercel Cron limiti:** Hobby plan'da 2 slot, Pro plan'da sınırsız
- **Mevcut cron job'lar:** Her ikisi de invoice kontrolü için
- **Yeni ihtiyaçlar:** Approval reminders, email campaign scheduler
- **Çözüm:** Mevcut job'ları birleştirerek 1 slot boşaltılabilir

---

**Son Güncelleme:** 2024
**Durum:** ⚠️ Vercel Cron limiti dolu - alternatif çözümler değerlendirilmeli

