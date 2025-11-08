const fs = require('fs')
const crypto = require('crypto')

// Random secret key oluştur
const secret = crypto.randomBytes(32).toString('base64')

const content = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://serlpsputsdqkgtzclnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTUzNTgsImV4cCI6MjA3NzY3MTM1OH0.ozlEJkOCkFt8Yl40gdXP7UPqZEtmDawSTqMqhjiR4xQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5NTM1OCwiZXhwIjoyMDc3NjcxMzU4fQ.6UINwDcWZW1qklOKb8Ls8Z2veO0gbcT9RCNbleuOzuU

# Direct Connection String
DATABASE_URL=postgresql://postgres:WnC0jpTEVNEbn56I@db.serlpsputsdqkgtzclnn.supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_SECRET=${secret}
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
`

fs.writeFileSync('.env.local', content)

console.log('✅ .env.local dosyası oluşturuldu!')
console.log('📝 NEXTAUTH_SECRET:', secret)







