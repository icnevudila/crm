# Multi-Tenant Test Kılavuzu

## Nasıl Test Edilir?

### 1. Normal Kullanıcı (Admin) Testi

1. **Admin hesabıyla giriş yapın** (SuperAdmin değil)
2. Dashboard'a gidin - KPIs görüntülenmeli
3. Customers, Products, Deals modüllerine gidin
4. **Beklenen**: Sadece kendi şirketinizin verilerini görmelisiniz

### 2. Farklı Firma ile Test

1. **Başka bir firmanın admin hesabıyla giriş yapın**
2. Dashboard'a gidin - KPIs görüntülenmeli
3. **Beklenen**: Farklı veriler görmelisiniz (farklı müşteri sayısı, farklı toplam satış, vb.)
4. Customers listesine gidin
5. **Beklenen**: Önceki firmadan farklı müşterileri görmelisiniz (veya boş liste)

### 3. SuperAdmin Testi

1. **SuperAdmin hesabıyla giriş yapın**
2. Dashboard'a gidin - KPIs görüntülenmeli
3. **Beklenen**: Tüm firmaların toplam verilerini görmelisiniz
4. Modüllerde firma filtresi olmalı (SuperAdmin için)

## Sorun Tespiti

Eğer farklı bir firmayla giriş yaptığınızda aynı verileri görüyorsanız:

1. **Cookie'yi temizleyin** (Browser'da F12 → Application → Cookies → `crm_session` silin)
2. **Sayfayı yenileyin** (Ctrl+F5)
3. **Tekrar giriş yapın**
4. **Console'u kontrol edin** (F12 → Console) - session bilgisi doğru mu?

## Debug Logları

Development modunda (localhost), terminal'de şu logları göreceksiniz:

```
[KPIs API] Session info: {
  isSuperAdmin: false,
  companyId: 'xxx-xxx-xxx',
  userId: 'xxx-xxx-xxx',
  role: 'ADMIN'
}
```

Bu loglarda `companyId`'nin doğru olduğunu kontrol edin.


