const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Tüm API route dosyalarını bul
async function fixApiRoutes() {
  const files = await glob('src/app/api/**/route.ts');
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 1. createClient kullanımını getSupabaseWithServiceRole() ile değiştir
    if (content.includes('const supabase = createClient(')) {
      // Import'u değiştir
      content = content.replace(
        /import { createClient } from '@supabase\/supabase-js'/g,
        "import { getSupabaseWithServiceRole } from '@/lib/supabase'"
      );
      
      // Module-level createClient'ı kaldır
      content = content.replace(
        /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\)\s*\n/g,
        ''
      );
      
      // Her fonksiyonun başına supabase = getSupabaseWithServiceRole() ekle
      content = content.replace(
        /(export async function (GET|POST|PUT|DELETE|PATCH)\([^)]*\)\s*\{[^}]*try\s*\{)/g,
        (match) => {
          if (!match.includes('const supabase = getSupabaseWithServiceRole()') && 
              !match.includes('const supabase = getSupabase()')) {
            return match.replace('try {', 'try {\n    const supabase = getSupabaseWithServiceRole()');
          }
          return match;
        }
      );
      
      modified = true;
    }
    
    // 2. dynamic = 'force-dynamic' ekle (yoksa)
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      // Import'lardan sonra, ilk export'tan önce ekle
      const importEnd = content.lastIndexOf("import");
      const firstExport = content.indexOf("export", importEnd);
      
      if (firstExport !== -1) {
        const beforeExport = content.substring(0, firstExport);
        const afterExport = content.substring(firstExport);
        
        // Eğer zaten revalidate varsa, ondan önce ekle
        if (afterExport.includes("export const revalidate")) {
          content = beforeExport + "// Dynamic route - build-time'da çalışmasın\nexport const dynamic = 'force-dynamic'\n" + afterExport;
        } else {
          content = beforeExport + "// Dynamic route - build-time'da çalışmasın\nexport const dynamic = 'force-dynamic'\nexport const revalidate = 0\n\n" + afterExport;
        }
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
    }
  }
}

fixApiRoutes().catch(console.error);

