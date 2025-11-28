# PowerShell script to disable AI face verification (testing mode)
# Run: .\scripts\disable-ai-verification.ps1

$envFile = ".env.local"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AI Face Verification Disabler" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $envFile)) {
    Write-Host "✅ No .env.local file - AI is already disabled" -ForegroundColor Green
    exit 0
}

$content = Get-Content $envFile

# Check current state
if ($content -match "ENABLE_AI_FACE_VERIFICATION=false") {
    Write-Host "✅ AI Verification is already DISABLED (Testing Mode)" -ForegroundColor Green
} elseif ($content -match "ENABLE_AI_FACE_VERIFICATION=true") {
    Write-Host "🔄 Disabling AI Verification (enabling Testing Mode)..." -ForegroundColor Yellow
    $content = $content -replace "ENABLE_AI_FACE_VERIFICATION=true", "ENABLE_AI_FACE_VERIFICATION=false"
    $content | Set-Content $envFile
    Write-Host "✅ AI Verification DISABLED - Testing Mode Active" -ForegroundColor Green
} else {
    Write-Host "✅ AI Verification not configured - Testing Mode Active by default" -ForegroundColor Green
}

Write-Host ""
Write-Host "Testing Mode Active:" -ForegroundColor Cyan
Write-Host "  - All attendance requests will be approved" -ForegroundColor White
Write-Host "  - Fixed match score: 90%" -ForegroundColor White
Write-Host "  - No Gemini API calls (free)" -ForegroundColor White
Write-Host "  - Perfect for development/testing" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server: npm run dev" -ForegroundColor White
Write-Host "2. Test attendance marking freely" -ForegroundColor White
Write-Host ""
Write-Host "To enable AI verification later, run:" -ForegroundColor Yellow
Write-Host "   npm run enable-ai" -ForegroundColor White
Write-Host ""
