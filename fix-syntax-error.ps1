$filePath = "d:\temp\BusinessAI-project\ai-saas-landing\app\accounting\techno-quotation\page.tsx"
$content = Get-Content $filePath

# Keep lines 1-827 and lines 892 onwards
$newContent = $content[0..827] + $content[891..($content.Length-1)]

$newContent | Set-Content $filePath

Write-Host "File fixed successfully!"
