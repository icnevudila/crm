# CRM Enterprise v3 - Geliştirme Yol Haritası (Roadmap)

Bu belge, CRM projesini "Tam Otomatik ve Yapay Zeka Destekli" bir sisteme dönüştürmek için izlenecek stratejik planı içerir.

## 📅 Faz 1: Stabilizasyon ve Temizlik (Hemen Başlanacak)
**Hedef:** Mevcut "çalışmayan" kısımları düzeltmek, sistemi hatasız ("Zero Error") hale getirmek ve modüller arası bağlantıyı sağlamak.

- [ ] **Kapsamlı Sayfa Denetimi:** Tüm sayfaların (`src/app`) açıldığının ve temel fonksiyonların (Ekle/Sil/Düzenle) çalıştığının doğrulanması.
- [ ] **UI/UX İyileştirmeleri:** "Görüntülenemeyen sayfa" ve "Çalışmayan buton" şikayetlerinin giderilmesi.
- [ ] **Tip Güvenliği:** Kritik tip hatalarının giderilmesi (özellikle `page.tsx` ve form bileşenlerinde).
- [ ] **Performans:** Gereksiz render'ların önlenmesi ve sayfa geçişlerinin hızlandırılması.
- [ ] **Bildirim Standardizasyonu:** Tüm işlemlerin (Başarılı/Hatalı) kullanıcıya Toast mesajı ile bildirilmesi.
- [ ] **Modül Bağlantıları:** Bir modülden diğerine (örn: Fatura -> Sevkiyat) geçişlerin pürüzsüz olması ve veri taşıması.

## 🚀 Faz 2: Eksik Core Fonksiyonlar
**Hedef:** CRM'in temel taşlarını tamamlamak ve eksiksiz bir iş akışı sunmak.

- [ ] **Gelişmiş Raporlama:** Dashboard'ların gerçek verilerle beslenmesi.
- [ ] **Finans Modülü:** Fatura/Tahsilat döngüsünün eksiksiz çalışması.
- [ ] **İzin Yönetimi:** Rol bazlı (Admin/User/Manager) erişim kontrollerinin netleştirilmesi.
- [ ] **Bildirim Merkezi:** Uygulama içi bildirimlerin (Toast harici) geçmişinin tutulması.

## ⚡ Faz 3: Otomasyon Motoru (Automation Engine)
**Hedef:** Hardcoded (kod içine gömülü) otomasyonlardan, dinamik "Workflow" yapısına geçiş. Sistem bir çark gibi işlemeli.

- [ ] **Workflow Altyapısı:** Veritabanında `Workflows`, `Triggers`, `Actions` tablolarının oluşturulması.
- [ ] **Görsel Otomasyon Oluşturucu:** Kullanıcının "Eğer Fırsat > 100.000 TL ise -> Yöneticie SMS At" gibi kuralları tanımlayabileceği UI.
- [ ] **Olay Güdümlü Mimari (Event-Driven):** Her kayıt işleminin bir "Event" fırlatması ve diğer modülleri tetiklemesi.
- [ ] **Tetikleyiciler (Triggers):**
    - Kayıt Oluşturulduğunda (Deal, Customer, Invoice...)
    - Durum Değiştiğinde
    - Tarih Geldiğinde (Örn: Fatura vadesi)
- [ ] **Aksiyonlar (Actions):**
    - E-posta/SMS/WhatsApp Gönder
    - Görev Oluştur
    - Slack/Teams Bildirimi
    - Webhook Tetikle
    - Başka Modülde Kayıt Aç (Örn: Satış kapandı -> Fatura oluştur)

## 🧠 Faz 4: Yapay Zeka Entegrasyonu (AI Layer)
**Hedef:** AI'ı sadece bir "Chatbot" olmaktan çıkarıp sistemin beyni haline getirmek.

- [ ] **Bağlamsal AI Asistanı:** Bulunduğunuz sayfaya göre (örn: Müşteri detayı) öneriler sunan yan panel.
- [ ] **Akıllı İçerik Üretimi:**
    - "Bu müşteriye nazik bir ödeme hatırlatması yaz"
    - "Toplantı notlarını özetle ve aksiyon maddeleri çıkar"
- [ ] **Lead Scoring (Puanlama):** Müşterilerin kapanma ihtimalini geçmiş verilere göre tahminleme.
- [ ] **Sesli Komut:** "Ahmet Bey'e yarın saat 14:00 için toplantı oluştur" komutunu işleme.

## 🛠️ Teknik Altyapı İyileştirmeleri
- **Testing:** Kritik akışlar için E2E testleri (Playwright).
- **Monitoring:** Hata takibi (Sentry vb.) entegrasyonu.
