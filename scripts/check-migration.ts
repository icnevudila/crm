/**
 * Migration Kontrol Script
 * Product tablosunda category kolonunun olup olmadığını kontrol eder
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ HATA: Supabase environment variables gerekli!')
  process.exit(1)
}

async function checkMigration() {
  try {
    console.log('🔍 Migration kontrol ediliyor...\n')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ HATA: Supabase environment variables gerekli!')
      process.exit(1)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Category kolonunu kontrol et
    const { data, error } = await supabase
      .from('Product')
      .select('category')
      .limit(1)

    if (error) {
      if (error.code === '42703' || error.message.includes('does not exist')) {
        console.log('❌ Migration ÇALIŞTIRILMAMIŞ!')
        console.log('   Product.category kolonu bulunamadı.\n')
        console.log('💡 ÇÖZÜM:')
        console.log('   1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard')
        console.log('   2. SQL Editor\'a gidin')
        console.log('   3. supabase/migrations/005_enhance_product_system.sql dosyasını çalıştırın\n')
        process.exit(1)
      } else {
        console.error('❌ Hata:', error.message)
        process.exit(1)
      }
    } else {
      console.log('✅ Migration ÇALIŞTIRILMIŞ!')
      console.log('   Product.category kolonu mevcut.\n')
      
      // Diğer kolonları da kontrol et
      const columns = ['sku', 'barcode', 'status', 'minStock', 'maxStock', 'unit']
      for (const col of columns) {
        const { error: colError } = await supabase
          .from('Product')
          .select(col)
          .limit(1)
        
        if (colError && (colError.code === '42703' || colError.message.includes('does not exist'))) {
          console.log(`⚠️  Product.${col} kolonu bulunamadı!`)
        } else {
          console.log(`✅ Product.${col} kolonu mevcut.`)
        }
      }
      
      console.log('\n✅ Tüm migration kolonları mevcut!')
    }
  } catch (error: any) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

checkMigration()

