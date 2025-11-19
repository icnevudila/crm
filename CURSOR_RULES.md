# Cursor Rules

Bu doküman, Cursor ortamında çalışan tüm agentların uyması gereken ortak kuralları tanımlar. Amaç; canlı ortamda sorun çıkarmadan, performans ve veri güvenliğini koruyarak çalışmak, bakım maliyetini düşürmek ve tutarlı bir işleyiş sağlamaktır.

## 1. Genel Çalışma Prensipleri
- Her hamle öncesinde mevcut repo kurallarını ve proje dokümantasyonunu gözden geçir.
- `ask mode` ve `agent mode` ayrımına uy: kod/komut çalıştırmak gerekiyorsa önce uygun moda geçildiğinden emin ol.
- Görevleri parçalara ayır; karmaşık işlerde plan yapıp TODO listesini güncel tut.
- Kullanıcıya açık ve kısa özetlerle bilgi ver, ek varsayım gerekiyorsa mutlaka sor.

## 2. Performans ve Optimizasyon
- Repo kurallarında belirtilen performans yönergelerine sadık kal (SWR cache, server component önceliği, skeleton kullanımı, prefetch vb.).
- Yeni kod yazarken gereksiz veriyi çekme; API sorgularını limit, filtre ve indekslere uygun kurgula.
- UI tarafında minimum render maliyeti için memoization ve lazy loading’i gerektiği yerde uygula.
- Çalışan optimizasyonları bozma: build script, caching stratejisi veya edge yapılandırmalarını değiştirmeden önce etki analizini yazılı olarak yap.

## 3. Canlı Ortam Güvenliği
- Canlı (production) sistem üzerinde doğrudan komut veya migration çalıştırma; önce yerelde veya staging’de test et.
- Komut çalıştırırken geri alınamaz operasyonlardan kaçın; gerekiyorsa kullanıcıdan onay al.
- Environment değişkenlerini değiştirmeden önce mevcut değerleri doğrula ve dokümante et.
- Güncellemeler sonrası health check, login ve kritik API uçlarını test etmeden deploy tamamlanmış sayma.

## 4. Veri Tabanı ve Depolama
- Gereksiz kolon, tablo veya büyük JSON objeleri oluşturmaktan kaçın; mevcut şemayı yeniden kullan.
- Her sorguda multi-tenant sınırlarını (`companyId` vb.) koru; RLS kurallarını ihlal etme.
- Veri saklama kararlarını dokümante et, log veya geçici verileri süresi dolunca temizle.
- Supabase bağlantılarını singleton üzerinden yönet, yeni client üretme.

## 5. Loglama ve Hata Yönetimi
- Production’a gidecek kodda `console.log` yerine merkezi log veya error helper kullan.
- Hata mesajlarını kullanıcı dostu tut; hassas bilgileri loglara yazma.
- Olur olmaz log dökme, özellikle edge fonksiyonlarında gereksiz IO’dan kaçın.

## 6. Kod Değişikliği Süreci
- Her önemli değişiklikte ilgili testleri çalıştır (lint, unit, e2e gerekiyorsa).
- Kod stilini koru; TypeScript strict kurallarına uy, `any` kullanımından kaçın.
- Dosya yapısı ve naming standartlarını bozma; yeni dosyaları doğru klasöre ekle.
- Değişiklik özetini ve potansiyel riskleri kullanıcıya aktarmayı unutma.

## 7. İş Birliği ve Dokümantasyon
- Yeni kurallar veya önemli bulgular için Markdown dokümanı güncelle; “bilgi beyaz noktası” bırakma.
- Başkalarının çalışmasını etkileyecek değişikliklerde açıkça uyarı ver; TODO listesine ek görev bırak.
- Agentlar arası tutarlılık için varsayılan cevap dili Türkçe olmalı.

## 8. Son Kontrol
- Canlıya çıkmadan önce: performans hedefleri, güvenlik kontrolleri, veri bütünlüğü ve UI/UX akışı teker teker doğrulanmalı.
- Beklenmeyen sonuç veya log fark edilirse kullanıcıya hemen bildir; gerekirse değişikliği geri almayı öner.

Bu kurallar tüm agentlar için bağlayıcıdır. Yeni bir vaka ortaya çıkarsa dokümanı güncelle ve takıma haber ver. Kriz anında bile önce kuralları kontrol et; hızlı ama kontrolsüz değişiklik yapma.
















