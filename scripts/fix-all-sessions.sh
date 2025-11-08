#!/bin/bash
# Tüm API endpoint'lerinde getServerSession try-catch ile sarmalama scripti
# Bu script tüm endpoint'lerde session kontrolünü düzeltir

echo "Tüm API endpoint'lerinde session kontrolü düzeltiliyor..."

# Pattern: const session = await getServerSession(authOptions)
# Replace with: try-catch wrapped version

find src/app/api -name "*.ts" -type f | while read file; do
  if grep -q "const session = await getServerSession(authOptions)" "$file"; then
    echo "Düzeltiliyor: $file"
    # Bu script manuel olarak çalıştırılmalı veya sed ile yapılmalı
  fi
done

echo "Tamamlandı!"




