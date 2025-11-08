/**
 * Customer tablosuna eksik kolonları ekle
 * Bu script schema-extension.sql'deki migration'ı çalıştırır
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local dosyasını yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

async function addCustomerColumns() {
  console.log('🔄 Customer tablosuna kolonlar ekleniyor...')

  try {
    // Customer tablosuna kolonları ekle
    const queries = [
      `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS address TEXT`,
      `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS sector VARCHAR(100)`,
      `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS website VARCHAR(255)`,
      `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50)`,
      `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS notes TEXT`,
    ]

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: query })
      
      if (error) {
        // RPC fonksiyonu yoksa direkt query çalıştır
        console.log(`📝 Query çalıştırılıyor: ${query}`)
        // Supabase client ile direkt query çalıştıramayız, bu yüzden kullanıcıya SQL'i manuel çalıştırmasını söyleyelim
        console.warn('⚠️  Bu script Supabase RPC gerektirir.')
        console.warn('📋 Alternatif: Supabase Dashboard > SQL Editor\'de şu sorguyu çalıştırın:')
        console.log('\n' + queries.join(';\n') + ';\n')
        break
      }
      
      console.log(`✅ Kolon eklendi: ${query.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1]}`)
    }

    console.log('✅ Customer tablosu güncellendi!')
  } catch (error: any) {
    console.error('❌ Hata:', error.message)
    console.log('\n📋 Manuel olarak Supabase Dashboard > SQL Editor\'de şu sorguyu çalıştırın:')
    console.log(`
ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS sector VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT;
    `)
    process.exit(1)
  }
}

addCustomerColumns()

