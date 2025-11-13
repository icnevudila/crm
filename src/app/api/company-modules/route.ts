import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin görebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin modül izinlerini görüntüleyebilir.')
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId parametresi zorunludur' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Supabase database type tanımları eksik, CompanyModule tablosu için type tanımı yok
    const { data, error } = await (supabase
      .from('CompanyModule') as any)
      .select('*')
      .eq('companyId', companyId)
      .order('module', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Modül bilgileri alınamadı' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN: Herhangi bir Company'nin modüllerini yönetebilir
    // ADMIN: Sadece kendi Company'sinin modüllerini görebilir (yönetemez - SuperAdmin yapar)
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    if (!isSuperAdmin) {
      return buildPermissionDeniedResponse('Sadece SuperAdmin modül yönetimi yapabilir.')
    }

    const body = await request.json()
    const { companyId, module, enabled = true } = body

    if (!companyId || !module) {
      return NextResponse.json(
        { error: 'companyId ve module alanları zorunludur' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // maxModules kontrolü - sadece modül eklenirken (enabled = true)
    if (enabled) {
      // Kurumun mevcut aktif modül sayısını kontrol et
      const { count: currentModuleCount } = await supabase
        .from('CompanyModule')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', companyId)
        .eq('enabled', true)

      // Kurum limitasyonlarını kontrol et
      const { data: company } = await supabase
        .from('Company')
        .select('maxModules')
        .eq('id', companyId)
        .single()

      if (company && company.maxModules !== null) {
        // Eğer bu modül zaten aktifse, sayıyı artırmayız
        const { data: existingModule } = await supabase
          .from('CompanyModule')
          .select('enabled')
          .eq('companyId', companyId)
          .eq('module', module)
          .single()

        // Modül zaten aktif değilse ve limit aşılıyorsa hata ver
        if (!existingModule?.enabled && currentModuleCount !== null && currentModuleCount >= company.maxModules) {
          return NextResponse.json(
            { error: 'Modül limiti aşıldı', message: `Bu kurumun maksimum modül sayısı ${company.maxModules}. Mevcut aktif modül sayısı: ${currentModuleCount}` },
            { status: 403 }
          )
        }
      }
    }

    // Upsert - varsa güncelle, yoksa oluştur
    const upsertData = {
      companyId,
      module,
      enabled,
      updatedAt: new Date().toISOString(),
    }

    // Supabase database type tanımları eksik, CompanyModule tablosu için type tanımı yok
    const { data, error } = await (supabase
      .from('CompanyModule') as any)
      .upsert(upsertData, {
        onConflict: 'companyId,module',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Modül kaydedilemedi' },
      { status: 500 }
    )
  }
}


