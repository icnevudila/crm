# Backup Script - Mal Kabul Sistemi
# PowerShell script - Windows için

$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "Backup klasörü oluşturuldu: $backupDir" -ForegroundColor Green

# Önemli dosyaları kopyala
$filesToBackup = @(
    "supabase/migrations/009_purchase_reservation_system.sql",
    "run_purchase_transaction_migration.sql",
    "check_purchase_transaction_table.sql",
    "src/app/api/purchase-shipments/",
    "src/components/purchase-shipments/",
    "src/app/[locale]/purchase-shipments/",
    "src/app/api/invoices/route.ts",
    "BACKUP_CHECKLIST.md"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        $destPath = Join-Path $backupDir (Split-Path $file -Leaf)
        if (Test-Path $file -PathType Container) {
            Copy-Item -Path $file -Destination $destPath -Recurse -Force
            Write-Host "✓ Klasör kopyalandı: $file" -ForegroundColor Cyan
        } else {
            Copy-Item -Path $file -Destination $destPath -Force
            Write-Host "✓ Dosya kopyalandı: $file" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ Dosya bulunamadı: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nBackup tamamlandı! Klasör: $backupDir" -ForegroundColor Green
Write-Host "Geri dönmek için bu klasördeki dosyaları geri kopyalayın." -ForegroundColor Yellow

