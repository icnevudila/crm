# 🎮 Gamification İş Akışları - Öneriler

## 🎯 Genel Konsept

Rozet ve streak sistemini genişleterek, kullanıcıların günlük iş akışlarını oyunlaştırarak daha eğlenceli ve motive edici hale getirelim.

---

## 📋 Önerilen Özellikler

### 1. 🎯 Quest/Mission Sistemi (Günlük/Haftalık Görevler)

#### Konsept
- Her gün/hafta otomatik görevler oluşturulur
- Kullanıcılar görevleri tamamlayarak puan ve rozet kazanır
- İş akışına entegre edilmiş, doğal olarak tamamlanır

#### Örnek Görevler

**Günlük Görevler:**
- ✅ 3 yeni müşteri ekle → 50 puan
- ✅ 1 deal'i WON yap → 100 puan
- ✅ 5 teklif gönder → 75 puan
- ✅ 10 görev tamamla → 60 puan
- ✅ 1 fatura kes → 80 puan

**Haftalık Görevler:**
- ✅ 10 deal kazan → 500 puan + Özel Rozet
- ✅ 20 müşteri ekle → 400 puan
- ✅ 50 teklif gönder → 300 puan
- ✅ 100 görev tamamla → 200 puan

**Özel Görevler:**
- ✅ İlk satışını yap → İlk Satış Rozeti
- ✅ 1 hafta streak koru → Streak Master Rozeti
- ✅ 1 ayda 50 deal kazan → Power Seller Rozeti

#### UI Tasarımı
```
┌─────────────────────────────────────┐
│ 🎯 Günlük Görevler                  │
├─────────────────────────────────────┤
│ ✅ 3 yeni müşteri ekle              │
│    ████████░░ 2/3 (67%)            │
│    +50 puan                         │
│    [Müşteri Ekle] butonu            │
├─────────────────────────────────────┤
│ ⏳ 1 deal'i WON yap                 │
│    ░░░░░░░░░░ 0/1 (0%)             │
│    +100 puan                        │
│    [Deal'leri Gör] butonu           │
└─────────────────────────────────────┘
```

---

### 2. 📊 Progress Bars & Milestones (İlerleme Çubukları)

#### Konsept
- Her modülde ilerleme çubukları gösterilir
- Belirli kilometre taşlarına ulaşınca ödüller verilir
- Görsel geri bildirim ile motivasyon artar

#### Örnek Milestones

**Deal Milestones:**
- 🥉 10 Deal → Bronz Rozet
- 🥈 50 Deal → Gümüş Rozet
- 🥇 100 Deal → Altın Rozet
- 💎 500 Deal → Elmas Rozet

**Customer Milestones:**
- 📞 25 Müşteri → İletişim Ustası
- 👥 100 Müşteri → Network Master
- 🌐 500 Müşteri → Global Networker

#### UI Tasarımı
```
┌─────────────────────────────────────┐
│ Deal İlerlemeniz                    │
├─────────────────────────────────────┤
│ ████████████░░░░░░░░ 45/100         │
│                                      │
│ Milestones:                          │
│ ✅ 10 Deal (Bronz)                  │
│ ✅ 25 Deal (Gümüş)                  │
│ ⏳ 50 Deal (Gümüş) → 5 kaldı!       │
│ 🔒 100 Deal (Altın)                 │
└─────────────────────────────────────┘
```

---

### 3. 🏆 Achievement System (Başarı Sistemi)

#### Konsept
- Belirli kombinasyonlar ve özel durumlar için rozetler
- Kullanıcıları farklı yollarla ödüllendirir
- Keşfetme hissi verir

#### Örnek Achievements

**Hız Achievements:**
- ⚡ Hızlı Satıcı: 1 günde 5 deal kazan
- 🚀 Roket: 1 haftada 20 deal kazan
- 💨 Rüzgar: 1 ayda 100 deal kazan

**Kalite Achievements:**
- 🎯 Keskin Nişancı: %80 acceptance rate (10+ teklif)
- 💰 Değer Yaratıcı: Toplam 1M TL deal değeri
- ⭐ Yıldız Satıcı: Ortalama 4.5+ müşteri memnuniyeti

**Kombinasyon Achievements:**
- 🔥 Ateş Hattı: 7 gün streak + 7 deal kazan
- 🌟 Süper Hafta: 1 haftada 10 deal + 20 müşteri
- 🎪 Tam Takım: Tüm modüllerde aktivite (Deal, Quote, Invoice, Task)

#### UI Tasarımı
```
┌─────────────────────────────────────┐
│ 🏆 Başarılarınız                     │
├─────────────────────────────────────┤
│ Kilitli Başarılar:                   │
│ 🔒 Hızlı Satıcı                      │
│    "1 günde 5 deal kazan"            │
│    İlerleme: 3/5 deal                │
│    [Deal'leri Gör]                   │
└─────────────────────────────────────┘
```

---

### 4. 🎲 Daily Challenges (Günlük Meydan Okumalar)

#### Konsept
- Her gün rastgele bir meydan okuma
- Zamanlı (24 saat)
- Özel ödüller ve rozetler

#### Örnek Challenges

**Bugünün Meydan Okuması:**
- 🎯 "Bugün 3 deal kazan ve 500 puan kazan!"
- ⏰ Süre: 18 saat kaldı
- 🏆 Ödül: Challenge Master Rozeti + 500 puan
- 📊 İlerleme: 1/3 deal

#### UI Tasarımı
```
┌─────────────────────────────────────┐
│ 🎲 Bugünün Meydan Okuması            │
├─────────────────────────────────────┤
│ 🎯 3 Deal Kazan                      │
│ ⏰ 18 saat kaldı                     │
│ ████████░░ 1/3 (33%)                │
│                                      │
│ 🏆 Ödül: Challenge Master + 500 puan│
│                                      │
│ [Deal'leri Gör] [İptal Et]          │
└─────────────────────────────────────┘
```

---

### 5. 📈 Leaderboards (Liderlik Tabloları)

#### Konsept
- Takım içi rekabet
- Farklı kategorilerde liderlik tabloları
- Haftalık/aylık reset

#### Kategoriler

**Haftalık Liderlik Tablosu:**
1. 🥇 En Çok Deal Kazanan
2. 🥈 En Çok Müşteri Ekleyen
3. 🥉 En Yüksek Streak

**Aylık Liderlik Tablosu:**
1. 🏆 Aylık Şampiyon
2. 💎 En Değerli Satıcı (toplam deal değeri)
3. ⭐ En Yüksek Acceptance Rate

#### UI Tasarımı
```
┌─────────────────────────────────────┐
│ 🏆 Haftalık Liderlik Tablosu        │
├─────────────────────────────────────┤
│ 1. 🥇 Ahmet Yılmaz                   │
│    15 deal | 1200 puan              │
│                                      │
│ 2. 🥈 Ayşe Demir                     │
│    12 deal | 980 puan                │
│                                      │
│ 3. 🥉 Sen                            │
│    8 deal | 650 puan                 │
│    ⬆️ 2 sıra yüksel!                │
└─────────────────────────────────────┘
```

---

### 6. 🎁 Reward System (Ödül Sistemi)

#### Konsept
- Puan sistemi
- Rozetler
- Özel ayrıcalıklar
- Profil özelleştirmeleri

#### Ödül Türleri

**Puanlar:**
- Her görev tamamlandığında puan kazanılır
- Puanlar leaderboard'da kullanılır
- Toplam puan rozetleri açabilir

**Rozetler:**
- Quest rozetleri
- Milestone rozetleri
- Achievement rozetleri
- Challenge rozetleri

**Özel Ayrıcalıklar:**
- Premium profil teması
- Özel avatar çerçeveleri
- Dashboard'da özel widget'lar
- Raporlarda özel görünüm

#### UI Tasarımı
```
┌─────────────────────────────────────┐
│ 🎁 Ödülleriniz                       │
├─────────────────────────────────────┤
│ Toplam Puan: 2,450                   │
│                                      │
│ Son Kazanılanlar:                    │
│ 🏆 Challenge Master (Bugün)          │
│ ⭐ Power Seller (Dün)                │
│ 🔥 Streak Master (3 gün önce)       │
│                                      │
│ [Tüm Rozetleri Gör]                  │
└─────────────────────────────────────┘
```

---

### 7. 🔔 Notification & Celebration (Bildirim & Kutlama)

#### Konsept
- Başarı anında görsel kutlama
- Confetti animasyonları
- Ses efektleri (opsiyonel)
- Bildirim sistemi

#### Örnek Kutlamalar

**Rozet Kazanıldığında:**
```
🎉 TEBRİKLER! 🎉
┌─────────────────────┐
│   🏆 İlk Satış      │
│                     │
│  Rozeti kazandınız! │
│                     │
│   [Paylaş] [Kapat]  │
└─────────────────────┘
```

**Milestone'a Ulaşıldığında:**
```
🎊 50 DEAL KAZANDINIZ! 🎊
┌─────────────────────┐
│   🥈 Gümüş Rozet    │
│                     │
│   +500 puan kazandı │
│                     │
│   [Detayları Gör]   │
└─────────────────────┘
```

---

## 🗄️ Database Yapısı

### Yeni Tablolar

```sql
-- Quest/Mission Tablosu
CREATE TABLE "Quest" (
  id UUID PRIMARY KEY,
  "questType" VARCHAR(50), -- 'DAILY', 'WEEKLY', 'SPECIAL'
  title VARCHAR(255),
  description TEXT,
  "targetType" VARCHAR(50), -- 'DEAL_WON', 'CUSTOMER_CREATED', etc.
  "targetCount" INTEGER,
  "rewardPoints" INTEGER,
  "rewardBadge" VARCHAR(50),
  "startDate" DATE,
  "endDate" DATE,
  "companyId" UUID,
  "createdAt" TIMESTAMP
);

-- User Quest Progress Tablosu
CREATE TABLE "UserQuestProgress" (
  id UUID PRIMARY KEY,
  "userId" UUID,
  "questId" UUID,
  "currentProgress" INTEGER DEFAULT 0,
  "completed" BOOLEAN DEFAULT false,
  "completedAt" TIMESTAMP,
  "companyId" UUID,
  "createdAt" TIMESTAMP
);

-- User Points Tablosu
CREATE TABLE "UserPoints" (
  id UUID PRIMARY KEY,
  "userId" UUID,
  "companyId" UUID,
  "totalPoints" INTEGER DEFAULT 0,
  "weeklyPoints" INTEGER DEFAULT 0,
  "monthlyPoints" INTEGER DEFAULT 0,
  "updatedAt" TIMESTAMP
);

-- Challenge Tablosu
CREATE TABLE "Challenge" (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  "challengeType" VARCHAR(50),
  "targetValue" INTEGER,
  "rewardPoints" INTEGER,
  "rewardBadge" VARCHAR(50),
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "companyId" UUID,
  "createdAt" TIMESTAMP
);
```

---

## 🎨 UI Component Önerileri

### 1. QuestCard Component
```typescript
<QuestCard
  quest={dailyQuest}
  progress={2}
  target={3}
  onComplete={() => {}}
/>
```

### 2. ProgressBar Component
```typescript
<ProgressBar
  current={45}
  target={100}
  milestones={[10, 25, 50, 100]}
  onMilestoneReach={(milestone) => {}}
/>
```

### 3. AchievementModal Component
```typescript
<AchievementModal
  achievement={achievement}
  open={true}
  onClose={() => {}}
/>
```

### 4. LeaderboardWidget Component
```typescript
<LeaderboardWidget
  category="weekly"
  currentUser={user}
  topUsers={topUsers}
/>
```

---

## 🚀 Uygulama Öncelikleri

### Faz 1: Temel Quest Sistemi (Öncelik: Yüksek)
- ✅ Günlük görevler oluşturma
- ✅ İlerleme takibi
- ✅ Otomatik tamamlama kontrolü
- ✅ Puan sistemi

### Faz 2: Milestones & Progress Bars (Öncelik: Orta)
- ✅ İlerleme çubukları
- ✅ Milestone rozetleri
- ✅ Görsel geri bildirim

### Faz 3: Challenges & Achievements (Öncelik: Orta)
- ✅ Günlük meydan okumalar
- ✅ Özel başarılar
- ✅ Kutlama animasyonları

### Faz 4: Leaderboards & Rewards (Öncelik: Düşük)
- ✅ Liderlik tabloları
- ✅ Ödül sistemi
- ✅ Profil özelleştirmeleri

---

## 💡 İş Akışı Entegrasyonu

### Deal Akışı
```
Deal Oluştur → Quest Progress +1
Deal WON → Quest Complete + Rozet Kazan
```

### Customer Akışı
```
Müşteri Ekle → Quest Progress +1
Milestone Check → Rozet Kazan
```

### Quote Akışı
```
Teklif Gönder → Quest Progress +1
Teklif ACCEPTED → Achievement Check
```

---

## 🎯 Kullanıcı Deneyimi

### Dashboard'da Görünüm
- Sol üstte: Günlük görevler widget'ı
- Sağ üstte: Streak ve rozetler (mevcut)
- Alt kısımda: Leaderboard widget'ı
- Orta kısımda: Progress bars ve milestones

### Bildirimler
- Quest tamamlandığında: Toast notification
- Rozet kazandığında: Modal kutlama
- Milestone'a ulaşıldığında: Banner notification

---

## 📊 Metrikler

### Takip Edilecek Metrikler
- Quest tamamlama oranı
- Ortalama puan kazanma
- Rozet kazanma sıklığı
- Leaderboard katılımı
- Streak koruma oranı

---

## 🔄 Otomasyonlar

### Otomatik Quest Oluşturma
- Her gün saat 00:00'da günlük görevler oluşturulur
- Her pazartesi haftalık görevler oluşturulur
- Özel görevler admin tarafından oluşturulabilir

### Otomatik Progress Güncelleme
- Deal WON → Quest progress +1
- Customer created → Quest progress +1
- Task completed → Quest progress +1
- Quote ACCEPTED → Quest progress +1

### Otomatik Ödül Verme
- Quest tamamlandığında → Puan + Rozet
- Milestone'a ulaşıldığında → Özel rozet
- Challenge tamamlandığında → Challenge rozeti

---

## 🎨 Tasarım Prensipleri

### Renkler
- Quest: Mavi tonları
- Achievement: Altın/Sarı tonları
- Challenge: Turuncu/Kırmızı tonları
- Milestone: Mor/İndigo tonları

### Animasyonlar
- Quest tamamlandığında: Confetti
- Rozet kazandığında: Scale + Fade
- Progress bar: Smooth fill animation
- Leaderboard: Slide up animation

---

## 📱 Responsive Tasarım

### Mobile
- Quest kartları: Tek sütun
- Progress bars: Dikey gösterim
- Leaderboard: Scrollable list

### Desktop
- Quest kartları: Grid layout
- Progress bars: Yatay gösterim
- Leaderboard: Tablo formatı

---

## ✅ Sonraki Adımlar

1. **Database Migration**: Quest, UserQuestProgress, UserPoints tabloları
2. **API Endpoints**: Quest CRUD, Progress tracking
3. **UI Components**: QuestCard, ProgressBar, AchievementModal
4. **Dashboard Entegrasyonu**: Widget'ları ekle
5. **Otomasyonlar**: Trigger'lar ve scheduled jobs
6. **Test**: Kullanıcı testleri ve geri bildirim

---

**Not**: Bu özellikler kademeli olarak eklenebilir. Önce temel quest sistemi ile başlayıp, kullanıcı geri bildirimlerine göre genişletilebilir.




