/**
 * Lighthouse Baseline Test Script
 * Performans metriklerini ölçer ve raporlar
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔍 Lighthouse Performance Test Başlatılıyor...\n')

// Test edilecek URL'ler
const testUrls = [
  'http://localhost:3000/dashboard',
  'http://localhost:3000/customers',
  'http://localhost:3000/quotes',
  'http://localhost:3000/invoices',
]

// Lighthouse CLI ile test et
function runLighthouseTest(url) {
  console.log(`📊 Testing: ${url}`)
  
  try {
    const output = execSync(
      `npx lighthouse ${url} --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"`,
      { encoding: 'utf-8' }
    )

    const report = JSON.parse(fs.readFileSync('./lighthouse-report.json', 'utf-8'))
    const scores = report.categories

    console.log(`\n✅ ${url} Test Sonuçları:`)
    console.log(`   Performance: ${(scores.performance.score * 100).toFixed(0)}%`)
    console.log(`   Accessibility: ${(scores.accessibility.score * 100).toFixed(0)}%`)
    console.log(`   Best Practices: ${(scores['best-practices'].score * 100).toFixed(0)}%`)
    console.log(`   SEO: ${(scores.seo.score * 100).toFixed(0)}%`)

    // Metrikler
    const metrics = report.audits
    console.log(`\n   📈 Metrikler:`)
    console.log(`   FCP: ${metrics['first-contentful-paint'].displayValue}`)
    console.log(`   LCP: ${metrics['largest-contentful-paint'].displayValue}`)
    console.log(`   TBT: ${metrics['total-blocking-time'].displayValue}`)
    console.log(`   CLS: ${metrics['cumulative-layout-shift'].displayValue}`)
    console.log(`   Speed Index: ${metrics['speed-index'].displayValue}`)

    return {
      url,
      scores,
      metrics,
    }
  } catch (error) {
    console.error(`❌ Test hatası: ${url}`, error.message)
    return null
  }
}

// Tüm URL'leri test et
console.log('🚀 Lighthouse testleri başlatılıyor...\n')

const results = testUrls.map((url) => runLighthouseTest(url))

// Özet rapor
console.log('\n📋 Özet Rapor:')
console.log('='.repeat(50))

results.forEach((result) => {
  if (result) {
    const perfScore = (result.scores.performance.score * 100).toFixed(0)
    console.log(`${result.url}: ${perfScore}% performance`)
  }
})

console.log('\n✅ Lighthouse testleri tamamlandı!')




