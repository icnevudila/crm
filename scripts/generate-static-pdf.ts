/**
 * Statik PDF oluşturma scripti
 * Bu script bir kez çalıştırılarak public/sistem-teklifi.pdf dosyası oluşturulur
 * 
 * Kullanım: npm run generate:pdf
 */

import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import * as fs from 'fs'
import * as path from 'path'

// SystemProposalPDF component'ini import et
// @ts-ignore - ts-node path resolution için
import SystemProposalPDF from '../src/components/pdf/SystemProposalPDF'

async function generateStaticPDF() {
  try {
    console.log('📄 PDF oluşturuluyor...')

    // Proposal verisini hazırla
    const proposal = {
      id: 'PROP-STATIC-001',
      title: 'CRM Enterprise V3 Sistem Teklifi',
      proposalNumber: `TEK-${new Date().getFullYear()}-STATIC`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
      customer: {
        name: 'Potansiyel Müşteri',
        email: '',
      },
      company: {
        name: 'CRM Enterprise V3',
        taxNumber: '',
        address: '',
        city: '',
        phone: '',
        email: 'info@crmenterprise.com',
        website: 'https://crmenterprise.com',
      },
      packages: [
        {
          name: 'Standart Paket',
          description: 'Temel CRM özellikleri ve standart modüller',
          price: 5000,
          period: 'monthly',
          features: [
            'Dashboard ve KPI metrikleri',
            'Müşteri yönetimi (CRM)',
            'Teklif ve Fatura yönetimi',
            'Temel raporlama',
            '5 kullanıcı',
            'Email desteği',
          ],
        },
        {
          name: 'Profesyonel Paket',
          description: 'Gelişmiş özellikler ve tüm modüller',
          price: 10000,
          period: 'monthly',
          features: [
            'Tüm Standart Paket özellikleri',
            'Stok yönetimi',
            'Sevkiyat takibi',
            'Gelişmiş raporlama ve analitik',
            '15 kullanıcı',
            'Öncelikli destek',
            'API erişimi',
          ],
        },
        {
          name: 'Enterprise Paket',
          description: 'Kurumsal çözümler ve özel entegrasyonlar',
          price: 20000,
          period: 'monthly',
          features: [
            'Tüm Profesyonel Paket özellikleri',
            'Sınırsız kullanıcı',
            'Özel entegrasyonlar',
            'Dedike destek',
            'Özel eğitim',
            'SLA garantisi',
            'Özel geliştirmeler',
          ],
        },
      ],
      modules: [
        { name: 'Dashboard', description: 'Ana gösterge paneli ve KPI metrikleri', price: 0 },
        { name: 'Firmalar', description: 'Müşteri firmaları yönetimi', price: 0 },
        { name: 'Tedarikçiler', description: 'Tedarikçi yönetimi', price: 0 },
        { name: 'Müşteriler', description: 'Müşteri ilişkileri yönetimi', price: 0 },
        { name: 'Fırsatlar', description: 'Fırsat yönetimi ve takibi', price: 0 },
        { name: 'Teklifler', description: 'Teklif oluşturma ve yönetimi', price: 0 },
        { name: 'Faturalar', description: 'Fatura yönetimi ve takibi', price: 0 },
        { name: 'Ürünler', description: 'Ürün kataloğu ve yönetimi', price: 0 },
        { name: 'Stok', description: 'Stok yönetimi ve hareket takibi', price: 0 },
        { name: 'Sevkiyatlar', description: 'Sevkiyat takibi', price: 0 },
        { name: 'Finans', description: 'Gelir-gider takibi', price: 0 },
        { name: 'Görevler', description: 'Görev yönetimi', price: 0 },
        { name: 'Destek Talepleri', description: 'Müşteri destek yönetimi', price: 0 },
        { name: 'Raporlar', description: 'Detaylı analiz ve raporlar', price: 0 },
        { name: 'Aktivite Logları', description: 'Sistem aktivite takibi', price: 0 },
      ],
      totalAmount: 10000, // Profesyonel paket varsayılan
      discount: 0,
      taxRate: 18,
      notes: 'Bu teklif 30 gün geçerlidir. Özel ihtiyaçlarınıza göre paket içeriği özelleştirilebilir.',
      terms: [
        'Bu teklif 30 gün geçerlidir.',
        'Ödeme koşulları anlaşma ile belirlenir.',
        'Sistem kurulumu ve eğitim dahildir.',
        'Teknik destek 1 yıl ücretsizdir.',
        'Yazılım güncellemeleri dahildir.',
        'Veri yedekleme günlük olarak yapılır.',
        '99.9% uptime garantisi (Enterprise paket).',
      ],
    }

    // PDF oluştur
    const SystemProposalPDFComponent = SystemProposalPDF as React.ComponentType<{ proposal: any }>
    const pdfElement = React.createElement(SystemProposalPDFComponent, { proposal })
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // Public klasörüne kaydet
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const pdfPath = path.join(publicDir, 'sistem-teklifi.pdf')
    fs.writeFileSync(pdfPath, pdfBuffer)

    console.log(`✅ PDF başarıyla oluşturuldu: ${pdfPath}`)
    console.log(`📄 Dosya boyutu: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    process.exit(0)
  } catch (error: any) {
    console.error('❌ PDF oluşturma hatası:', error)
    process.exit(1)
  }
}

generateStaticPDF()

 * Bu script bir kez çalıştırılarak public/sistem-teklifi.pdf dosyası oluşturulur
 * 
 * Kullanım: npm run generate:pdf
 */

import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import * as fs from 'fs'
import * as path from 'path'

// SystemProposalPDF component'ini import et
// @ts-ignore - ts-node path resolution için
import SystemProposalPDF from '../src/components/pdf/SystemProposalPDF'

async function generateStaticPDF() {
  try {
    console.log('📄 PDF oluşturuluyor...')

    // Proposal verisini hazırla
    const proposal = {
      id: 'PROP-STATIC-001',
      title: 'CRM Enterprise V3 Sistem Teklifi',
      proposalNumber: `TEK-${new Date().getFullYear()}-STATIC`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
      customer: {
        name: 'Potansiyel Müşteri',
        email: '',
      },
      company: {
        name: 'CRM Enterprise V3',
        taxNumber: '',
        address: '',
        city: '',
        phone: '',
        email: 'info@crmenterprise.com',
        website: 'https://crmenterprise.com',
      },
      packages: [
        {
          name: 'Standart Paket',
          description: 'Temel CRM özellikleri ve standart modüller',
          price: 5000,
          period: 'monthly',
          features: [
            'Dashboard ve KPI metrikleri',
            'Müşteri yönetimi (CRM)',
            'Teklif ve Fatura yönetimi',
            'Temel raporlama',
            '5 kullanıcı',
            'Email desteği',
          ],
        },
        {
          name: 'Profesyonel Paket',
          description: 'Gelişmiş özellikler ve tüm modüller',
          price: 10000,
          period: 'monthly',
          features: [
            'Tüm Standart Paket özellikleri',
            'Stok yönetimi',
            'Sevkiyat takibi',
            'Gelişmiş raporlama ve analitik',
            '15 kullanıcı',
            'Öncelikli destek',
            'API erişimi',
          ],
        },
        {
          name: 'Enterprise Paket',
          description: 'Kurumsal çözümler ve özel entegrasyonlar',
          price: 20000,
          period: 'monthly',
          features: [
            'Tüm Profesyonel Paket özellikleri',
            'Sınırsız kullanıcı',
            'Özel entegrasyonlar',
            'Dedike destek',
            'Özel eğitim',
            'SLA garantisi',
            'Özel geliştirmeler',
          ],
        },
      ],
      modules: [
        { name: 'Dashboard', description: 'Ana gösterge paneli ve KPI metrikleri', price: 0 },
        { name: 'Firmalar', description: 'Müşteri firmaları yönetimi', price: 0 },
        { name: 'Tedarikçiler', description: 'Tedarikçi yönetimi', price: 0 },
        { name: 'Müşteriler', description: 'Müşteri ilişkileri yönetimi', price: 0 },
        { name: 'Fırsatlar', description: 'Fırsat yönetimi ve takibi', price: 0 },
        { name: 'Teklifler', description: 'Teklif oluşturma ve yönetimi', price: 0 },
        { name: 'Faturalar', description: 'Fatura yönetimi ve takibi', price: 0 },
        { name: 'Ürünler', description: 'Ürün kataloğu ve yönetimi', price: 0 },
        { name: 'Stok', description: 'Stok yönetimi ve hareket takibi', price: 0 },
        { name: 'Sevkiyatlar', description: 'Sevkiyat takibi', price: 0 },
        { name: 'Finans', description: 'Gelir-gider takibi', price: 0 },
        { name: 'Görevler', description: 'Görev yönetimi', price: 0 },
        { name: 'Destek Talepleri', description: 'Müşteri destek yönetimi', price: 0 },
        { name: 'Raporlar', description: 'Detaylı analiz ve raporlar', price: 0 },
        { name: 'Aktivite Logları', description: 'Sistem aktivite takibi', price: 0 },
      ],
      totalAmount: 10000, // Profesyonel paket varsayılan
      discount: 0,
      taxRate: 18,
      notes: 'Bu teklif 30 gün geçerlidir. Özel ihtiyaçlarınıza göre paket içeriği özelleştirilebilir.',
      terms: [
        'Bu teklif 30 gün geçerlidir.',
        'Ödeme koşulları anlaşma ile belirlenir.',
        'Sistem kurulumu ve eğitim dahildir.',
        'Teknik destek 1 yıl ücretsizdir.',
        'Yazılım güncellemeleri dahildir.',
        'Veri yedekleme günlük olarak yapılır.',
        '99.9% uptime garantisi (Enterprise paket).',
      ],
    }

    // PDF oluştur
    const SystemProposalPDFComponent = SystemProposalPDF as React.ComponentType<{ proposal: any }>
    const pdfElement = React.createElement(SystemProposalPDFComponent, { proposal })
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // Public klasörüne kaydet
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const pdfPath = path.join(publicDir, 'sistem-teklifi.pdf')
    fs.writeFileSync(pdfPath, pdfBuffer)

    console.log(`✅ PDF başarıyla oluşturuldu: ${pdfPath}`)
    console.log(`📄 Dosya boyutu: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    process.exit(0)
  } catch (error: any) {
    console.error('❌ PDF oluşturma hatası:', error)
    process.exit(1)
  }
}

generateStaticPDF()
