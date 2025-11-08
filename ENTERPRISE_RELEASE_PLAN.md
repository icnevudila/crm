# 🚀 Full Enterprise Release - Uygulama Planı

## 📋 Genel Bakış

Bu güncelleme CRM Enterprise V3'ü full enterprise seviyeye yükseltmek için kapsamlı bir güncelleme içeriyor.

## 🎯 Öncelik Sırası

### Faz 1: Altyapı İyileştirmeleri (Kritik)
1. ✅ Session timeout hatalarını düzelt
2. ✅ Supabase connection pool optimize et
3. ✅ Login sonrası cache sistemi (60 saniye revalidation)
4. ✅ Döviz sistemi: EURO varsayılan, dinamik sembol (₺/€)

### Faz 2: Dashboard & Görünüm (Yüksek Öncelik)
5. Dashboard düzenlemesi: küçük grafikler solda, rakamsal tablo sağda
6. Admin/kullanıcı görünüm ayrımı
7. Dashboard grafikleri: teklif analizi (gerçekleşen/bekleyen, başarı oranı, red nedeni)

### Faz 3: Firma Yönetimi (Yüksek Öncelik)
8. Duplicate kontrolü (taxOffice + taxNumber)
9. Zorunlu alanlar (firmaAdı, kontakKişi, telefon)
10. Readonly görünüm (daraltılmış, "Düzenle" butonuna basılmadıkça)
11. Ülke kodlu telefon alanı (bayraklı, +90 default)
12. Firma durum renkleri (Potansiyel=amber, Müşteri=green, AltBayi=blue, Pasif=red)
13. Görüşme/Teklif/Görev butonları
14. Yeni firma sonrası doğrudan ilgili sayfa açılması

### Faz 4: Teklif Sistemi (Orta Öncelik)
15. Ürün görseli sütunu
16. Liste fiyatı otomatik gelmesi
17. İskonto yüzdesi hesaplama
18. Teklif onaylandığında sayfa yeşile dönmesi
19. Seri numarası zorunlu
20. PDF ismi "PI_GGAAyySA001_Firma_Ürün.pdf" formatı
21. Revize butonu ve sıra numarası
22. Teklif silme sadece admin (neden alanı zorunlu)

### Faz 5: Görüşmeler & Giderler (Orta Öncelik)
23. PDF/Excel indirme (tarih aralığına göre)
24. "Kim yazdı" kolonu
25. Admin kullanıcıya göre filtreleme
26. Gider girişi uyarısı
27. Gider tipleri (yakıt, konaklama, yemek, diğer)
28. Toplam tutar alanı

### Faz 6: Ürün & Stok (Orta Öncelik)
29. Ürün sekmesi direkt listeyle açılsın
30. Dil sekmesi devre dışı
31. Product tablosuna listPrice ve minPrice alanları
32. Ürün sırası: No–Marka–ÜrünKodu–ÜrünAdı–Fiyat–Resim
33. Stok modülünde seri numarası zorunlu
34. Alış/satış fiyatı sadece admin'e görünsün

### Faz 7: UI/UX İyileştirmeleri (Düşük Öncelik)
35. Satırlar daralt
36. Grid optimizasyonu
37. Mor/yeşil tonları kaldır
38. Koyu modda kontrast artır
39. Framer Motion animasyonları

### Faz 8: Yetkilendirme (Yüksek Öncelik)
40. Role-based CRUD
41. Admin override
42. Excel/PDF oluşturma yetkileri
43. Admin kullanıcı ekleme butonu

### Faz 9: Ek Modüller (Düşük Öncelik)
44. Borç/alacak bilgisi firmada uyarı olarak göster
45. Teklif/ödeme hatırlatıcıları Notification sistemine bağla

### Faz 10: Migration & Finalizasyon
46. Migration dosyası: 015_enterprise_release.sql
47. Supabase real-time listener ile anlık güncelleme
48. RLS companyId bazlı izolasyon aktif

## 📝 Notlar

- Tüm değişiklikler Next.js 15 + Supabase + Prisma + Tailwind + shadcn/ui uyumlu olacak
- Performans öncelikli: <300ms sekme geçişi, <500ms dashboard
- Multi-tenant yapı korunacak
- TR/EN locale desteği korunacak

