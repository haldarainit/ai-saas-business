# PowerShell script to enable AI face verification
# Run: .\scripts\enable-ai-verification.ps1

$envFile = ".env.local"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AI Face Verification Enabler" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $envFile)) {
    Write-Host "❌ .env.local not found. Creating it..." -ForegroundColor Red
    New-Item -Path $envFile -ItemType File
}

$content = Get-Content $envFile -ErrorAction SilentlyContinue

# Check if already enabled
if ($content -match "ENABLE_AI_FACE_VERIFICATION=true") {
    Write-Host "✅ AI Verification is already ENABLED" -ForegroundColor Green
} elseif ($content -match "ENABLE_AI_FACE_VERIFICATION=false") {
    Write-Host "🔄 Updating AI Verification to ENABLED..." -ForegroundColor Yellow
    $content = $content -replace "ENABLE_AI_FACE_VERIFICATION=false", "ENABLE_AI_FACE_VERIFICATION=true"
    $content | Set-Content $envFile
    Write-Host "✅ AI Verification ENABLED" -ForegroundColor Green
} else {
    Write-Host "➕ Adding AI Verification setting..." -ForegroundColor Yellow
    Add-Content -Path $envFile -Value "`n# Enable AI face verification`nENABLE_AI_FACE_VERIFICATION=true"
    Write-Host "✅ AI Verification ENABLED" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server: npm run dev" -ForegroundColor White
Write-Host "2. Go to /employee-management/attendance" -ForegroundColor White
Write-Host "3. Try clocking in with your face" -ForegroundColor White
Write-Host "4. Check console for AI Verification enabled: true" -ForegroundColor White
Write-Host ""
Write-Host "To disable AI verification later, run:" -ForegroundColor Yellow
Write-Host "   npm run disable-ai" -ForegroundColor White
Write-Host ""
