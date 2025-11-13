# 💾 Yedekleme ve Kurtarma Planı

Bu dokümantasyon, CRM Enterprise V3 sisteminin yedekleme ve kurtarma stratejilerini açıklar.

---

## 📋 Yedekleme Stratejisi

### 1. Supabase Veritabanı Yedekleme

#### Otomatik Yedekleme

Supabase otomatik olarak günlük yedekleme yapar:
- **Frekans**: Günlük
- **Saklama Süresi**: 7 gün (Pro plan), 30 gün (Team plan)
- **Yedekleme Tipi**: Point-in-time recovery (PITR)

#### Manuel Yedekleme

1. **Supabase Dashboard'dan**:
   - Project Settings → Database → Backups
   - "Create Backup" butonuna tıklayın
   - Yedekleme adı verin ve oluşturun

2. **SQL Dump (pg_dump)**:
   ```bash
   # Supabase connection string ile
   pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_$(date +%Y%m%d).sql
   ```

3. **Supabase CLI**:
   ```bash
   supabase db dump -f backup.sql
   ```

#### Yedekleme Kontrol Listesi

- [ ] Günlük otomatik yedeklemeler aktif mi?
- [ ] Haftalık manuel yedekleme yapılıyor mu?
- [ ] Yedeklemeler farklı lokasyonlarda saklanıyor mu?
- [ ] Yedekleme testi yapıldı mı? (kurtarma testi)

---

### 2. Vercel Deployment Yedekleme

#### Git Repository

- Tüm kod Git repository'de saklanır
- Her commit otomatik yedekleme sayılır
- Branch protection aktif olmalı

#### Environment Variables

- Vercel Dashboard'dan export edilebilir
- `.env.local` dosyası güvenli yerde saklanmalı
- Hassas bilgiler password manager'da tutulmalı

#### Static Assets

- Public klasöründeki dosyalar Git'te
- Supabase Storage'daki dosyalar ayrı yedeklenmeli

---

### 3. Supabase Storage Yedekleme

#### Manuel Yedekleme

1. **Supabase Dashboard'dan**:
   - Storage → Buckets
   - Her bucket için "Download" veya API ile export

2. **API ile**:
   ```bash
   # Storage API kullanarak dosyaları indirin
   # Örnek script: scripts/backup-storage.sh
   ```

#### Otomatik Yedekleme (Önerilen)

- Supabase Storage için cron job kurulabilir
- AWS S3 veya benzeri servise otomatik kopyalama

---

## 🔄 Kurtarma Senaryoları

### Senaryo 1: Veritabanı Geri Yükleme

#### Point-in-Time Recovery (PITR)

1. Supabase Dashboard'a gidin
2. Database → Backups → Point-in-Time Recovery
3. Geri yüklemek istediğiniz tarihi seçin
4. "Restore" butonuna tıklayın

#### SQL Dump'tan Geri Yükleme

```bash
# Yedek dosyasından geri yükleme
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < backup_20241109.sql
```

#### Adımlar:
1. Mevcut veritabanını yedekleyin (güvenlik için)
2. Yedek dosyasını hazırlayın
3. Veritabanını temizleyin (opsiyonel)
4. Yedekten geri yükleyin
5. Migration'ları çalıştırın (gerekirse)
6. Test edin

---

### Senaryo 2: Kod Geri Yükleme

#### Git ile Geri Yükleme

```bash
# Belirli bir commit'e geri dön
git checkout [commit-hash]

# Belirli bir tag'e geri dön
git checkout [tag-name]

# Vercel'de deploy et
vercel --prod
```

#### Vercel Deployment History

1. Vercel Dashboard → Deployments
2. Geri yüklemek istediğiniz deployment'ı bulun
3. "Redeploy" butonuna tıklayın

---

### Senaryo 3: Environment Variables Geri Yükleme

1. Vercel Dashboard → Settings → Environment Variables
2. Manuel olarak ekleyin veya
3. `.env.local` dosyasından import edin

---

### Senaryo 4: Storage Geri Yükleme

1. Yedeklenmiş dosyaları hazırlayın
2. Supabase Dashboard → Storage → Upload
3. Veya API ile yükleyin

---

## 🧪 Yedekleme Testi

### Test Senaryosu

1. **Test Ortamı Oluştur**:
   - Yeni bir Supabase projesi oluşturun (test için)
   - Yedekten geri yükleyin

2. **Doğrulama**:
   - Verilerin doğru yüklendiğini kontrol edin
   - Migration'ların çalıştığını kontrol edin
   - RLS politikalarının aktif olduğunu kontrol edin

3. **Performans Testi**:
   - Geri yüklenen veritabanının performansını test edin
   - Index'lerin doğru oluşturulduğunu kontrol edin

### Test Sıklığı

- **Aylık**: Tam kurtarma testi
- **Haftalık**: Yedekleme doğrulama
- **Günlük**: Otomatik yedekleme kontrolü

---

## 📊 Yedekleme Kontrol Listesi

### Günlük
- [ ] Otomatik yedeklemeler çalışıyor mu? (Supabase kontrol)
- [ ] Yedekleme boyutu normal mi?

### Haftalık
- [ ] Manuel yedekleme yapıldı mı?
- [ ] Yedekleme dosyaları farklı lokasyonda saklandı mı?
- [ ] Storage yedeklemesi yapıldı mı?

### Aylık
- [ ] Kurtarma testi yapıldı mı?
- [ ] Yedekleme stratejisi gözden geçirildi mi?
- [ ] Yedekleme süreleri kontrol edildi mi?

---

## 🚨 Acil Durum Planı

### Veri Kaybı Durumunda

1. **Durumu Değerlendir**:
   - Ne kadar veri kayboldu?
   - Hangi zaman aralığında?
   - Hangi modül etkilendi?

2. **Yedekten Geri Yükle**:
   - En son yedeklemeden geri yükle
   - Point-in-time recovery kullan (mümkünse)

3. **Doğrulama**:
   - Verilerin doğru yüklendiğini kontrol et
   - Kullanıcılara bilgi ver

4. **Önleme**:
   - Hatanın nedenini araştır
   - Önleyici önlemler al

### Sistem Çökmesi Durumunda

1. **Durumu Değerlendir**:
   - Hangi servis etkilendi? (Vercel/Supabase)
   - Ne kadar süre offline?

2. **Alternatif Çözüm**:
   - Backup deployment'a geç (Vercel)
   - Read-only moda geç (mümkünse)

3. **Kurtarma**:
   - Ana sistemi geri yükle
   - Verileri senkronize et

---

## 📝 Yedekleme Dokümantasyonu

### Yedekleme Lokasyonları

- **Supabase Backups**: Supabase Dashboard
- **Git Repository**: GitHub/GitLab (kod yedeklemesi)
- **Local Backups**: Güvenli sunucu/cloud storage
- **Environment Variables**: Password manager

### Yedekleme Formatları

- **Database**: SQL dump (.sql)
- **Storage**: ZIP archive
- **Code**: Git repository
- **Config**: JSON/YAML files

---

## 🔒 Güvenlik

### Yedekleme Güvenliği

- Yedeklemeler şifrelenmiş olmalı
- Erişim sınırlı olmalı (sadece yetkili kişiler)
- Yedeklemeler farklı lokasyonlarda saklanmalı
- Düzenli olarak test edilmeli

### Erişim Kontrolü

- Supabase yedeklemeleri: Sadece admin erişimi
- Git repository: Branch protection aktif
- Storage yedeklemeleri: Şifreli erişim

---

## 📞 Destek

Yedekleme veya kurtarma konusunda yardıma ihtiyacınız varsa:

- **Supabase Support**: support@supabase.com
- **Vercel Support**: Vercel Dashboard → Support
- **Dokümantasyon**: Bu dosya ve Supabase/Vercel dokümantasyonları

---

**Son Güncelleme**: 2024

**Hazırlayan**: AI Assistant


