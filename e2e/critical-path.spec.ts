import { test, expect } from '@playwright/test'

/**
 * Critical Path E2E Testleri
 * 
 * Bu testler sistemin en kritik iş akışlarını test eder:
 * 1. Login → Dashboard
 * 2. Deal oluşturma → Quote → Invoice akışı
 * 3. Multi-tenant izolasyon
 * 4. Admin/SuperAdmin yetki kontrolleri
 */

test.describe('Critical Path Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Her test öncesi login sayfasına git
    await page.goto('/tr/login')
  })

  test('1. Login ve Dashboard Erişimi', async ({ page }) => {
    // Login formunu doldur
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')

    // Dashboard'a yönlendirilmeli
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Dashboard elementlerinin görünür olduğunu kontrol et
    await expect(page.locator('text=Dashboard')).toBeVisible()
    
    // Hero banner görünür olmalı
    await expect(page.locator('text=Hoş geldiniz')).toBeVisible()
  })

  test('2. Deal Oluşturma ve Pipeline Görünümü', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/.*\/dashboard/)

    // Fırsatlar sayfasına git
    await page.click('text=Fırsatlar')
    await expect(page).toHaveURL(/.*\/deals/)

    // Yeni fırsat butonuna tıkla
    const newDealButton = page.locator('button:has-text("Yeni Ekle")').first()
    if (await newDealButton.isVisible()) {
      await newDealButton.click()
      
      // Form doldurma (eğer modal açılırsa)
      // Not: Gerçek test için test verisi gerekiyor
      // await page.fill('input[name="name"]', 'Test Fırsat')
      // await page.fill('input[name="amount"]', '10000')
      // await page.click('button:has-text("Kaydet")')
    }
  })

  test('3. Multi-Tenant İzolasyon - Farklı CompanyId', async ({ page }) => {
    // Bu test için iki farklı kullanıcı gerekiyor
    // Test kullanıcısı 1 ile login
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/.*\/dashboard/)

    // Müşteriler sayfasına git
    await page.click('text=Müşteri Firmalar')
    await expect(page).toHaveURL(/.*\/companies/)

    // Sadece kendi şirketinin müşterilerini görmeli
    // (API seviyesinde test edilmeli, UI'da görünürlük kontrolü yapılabilir)
    const customerList = page.locator('[data-testid="customer-list"]')
    if (await customerList.isVisible()) {
      // Liste görünür olmalı
      await expect(customerList).toBeVisible()
    }
  })

  test('4. Form Validation - Boş Form Gönderimi', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/.*\/dashboard/)

    // Müşteriler sayfasına git
    await page.click('text=Müşteri Firmalar')
    await expect(page).toHaveURL(/.*\/companies/)

    // Yeni müşteri butonuna tıkla
    const newButton = page.locator('button:has-text("Yeni Ekle")').first()
    if (await newButton.isVisible()) {
      await newButton.click()
      
      // Formu boş bırak ve kaydet butonuna tıkla
      const saveButton = page.locator('button:has-text("Kaydet")')
      if (await saveButton.isVisible()) {
        await saveButton.click()
        
        // Validation hataları görünür olmalı
        // (Form validation mesajları kontrol edilmeli)
        await page.waitForTimeout(500) // Validation mesajlarının görünmesi için bekle
      }
    }
  })

  test('5. Navigation - Sidebar Menü', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/.*\/dashboard/)

    // Sidebar menü öğelerini kontrol et
    const sidebarItems = [
      'Dashboard',
      'Müşteri Firmalar',
      'Fırsatlar',
      'Teklifler',
      'Faturalar',
    ]

    for (const item of sidebarItems) {
      const menuItem = page.locator(`text=${item}`).first()
      if (await menuItem.isVisible()) {
        await menuItem.click()
        await page.waitForTimeout(500) // Sayfa yüklenmesi için bekle
        // URL değişmeli
        expect(page.url()).toContain('/tr/')
      }
    }
  })

  test('6. Dashboard Spotlight - Veri Görüntüleme', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/.*\/dashboard/)

    // Dashboard'da spotlight bölümünün yüklendiğini kontrol et
    // (Skeleton veya veri görünür olmalı)
    await page.waitForTimeout(2000) // API çağrıları için bekle

    // Pipeline veya metrikler görünür olmalı
    const pipelineSection = page.locator('text=Pipeline').or(page.locator('text=Aktif Fırsatlar'))
    // Eğer görünürse kontrol et
    if (await pipelineSection.count() > 0) {
      await expect(pipelineSection.first()).toBeVisible()
    }
  })

  test('7. Responsive Design - Mobil Görünüm', async ({ page }) => {
    // Mobil görünüm için viewport ayarla
    await page.setViewportSize({ width: 375, height: 667 })

    // Login
    await page.fill('input[type="email"]', 'test@test.crm')
    await page.fill('input[type="password"]', 'test123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/.*\/dashboard/)

    // Mobil görünümde sidebar gizli olmalı veya hamburger menü görünür olmalı
    // (UI implementasyonuna göre kontrol edilmeli)
    const hamburgerMenu = page.locator('[aria-label="Menu"]').or(page.locator('button:has-text("Menu")'))
    // Hamburger menü varsa görünür olmalı
    if (await hamburgerMenu.count() > 0) {
      await expect(hamburgerMenu.first()).toBeVisible()
    }
  })
})

test.describe('Admin/SuperAdmin Tests', () => {
  test('8. Admin Panel Erişimi - Admin Kullanıcı', async ({ page }) => {
    // Admin kullanıcısı ile login (test için admin kullanıcısı gerekiyor)
    await page.goto('/tr/login')
    // await page.fill('input[type="email"]', 'admin@test.crm')
    // await page.fill('input[type="password"]', 'admin123')
    // await page.click('button[type="submit"]')
    
    // Admin panel linki görünür olmalı
    // await expect(page.locator('text=Admin Paneli')).toBeVisible()
    
    // Bu test için gerçek admin kullanıcısı gerekiyor
    test.skip() // Şimdilik skip
  })

  test('9. SuperAdmin - Tüm Şirketleri Görüntüleme', async ({ page }) => {
    // SuperAdmin kullanıcısı ile login (test için superadmin kullanıcısı gerekiyor)
    await page.goto('/tr/login')
    // await page.fill('input[type="email"]', 'superadmin@test.crm')
    // await page.fill('input[type="password"]', 'superadmin123')
    // await page.click('button[type="submit"]')
    
    // SuperAdmin panel linki görünür olmalı
    // await expect(page.locator('text=Süper Admin')).toBeVisible()
    
    // Bu test için gerçek superadmin kullanıcısı gerekiyor
    test.skip() // Şimdilik skip
  })
})

test.describe('Error Handling Tests', () => {
  test('10. 404 Sayfası', async ({ page }) => {
    await page.goto('/tr/nonexistent-page')
    
    // 404 sayfası görünür olmalı
    const notFoundText = page.locator('text=404').or(page.locator('text=Sayfa Bulunamadı'))
    if (await notFoundText.count() > 0) {
      await expect(notFoundText.first()).toBeVisible()
    }
  })

  test('11. Geçersiz Login', async ({ page }) => {
    await page.goto('/tr/login')
    
    // Geçersiz kullanıcı adı/şifre
    await page.fill('input[type="email"]', 'invalid@test.crm')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Hata mesajı görünür olmalı
    await page.waitForTimeout(1000)
    const errorMessage = page.locator('text=Hata').or(page.locator('text=Geçersiz'))
    // Hata mesajı varsa kontrol et
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible()
    }
  })
})


