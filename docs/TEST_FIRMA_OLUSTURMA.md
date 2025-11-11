# 🧪 Test Firma ve Kullanıcı Oluşturma

## 📋 Nasıl Çalıştırılır?

### Yöntem 1: Supabase Dashboard (Önerilen)

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. **SQL Editor**'a gidin
4. `supabase/create_test_company.sql` dosyasının içeriğini kopyalayın
5. SQL Editor'a yapıştırın ve **Run** butonuna tıklayın

### Yöntem 2: Supabase CLI

```bash
supabase db execute -f supabase/create_test_company.sql
```

## 📧 Giriş Bilgileri

SQL dosyası çalıştırıldıktan sonra:

- **Email**: `test@test.com`
- **Şifre**: `demo123`
- **Rol**: `ADMIN`
- **Firma**: `Test Firma`

## ✅ Oluşturulan Veriler

- ✅ 1 Test Firma (içinde hiç data yok)
- ✅ 1 Test Kullanıcı (ADMIN rolü)
- ✅ Tüm modül izinleri aktif

## 🧹 Temizleme

Eğer test firmasını silmek isterseniz:

```sql
DELETE FROM "User" WHERE email = 'test@test.com';
DELETE FROM "Company" WHERE name = 'Test Firma';
```

## ⚠️ Notlar

- Test firması içinde hiç data yok (müşteri, teklif, fatura vs. yok)
- Şifre `demo123` - AuthOptions'ta geçerli kabul ediliyor
- Her çalıştırmada önce mevcut test firması silinir, yeni bir tane oluşturulur











