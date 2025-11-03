# Création des utilitaires PDF

$root = "d:\react\UE-GI app\schooly"

$content = Get-Content -Path "$PSScriptRoot\..\..\templates\pdf-utils-template.txt" -Raw -ErrorAction SilentlyContinue

if (!$content) {
    Write-Host "⚠️  Template non trouvé, création manuelle requise" -ForegroundColor Yellow
    Write-Host "   Fichier à créer: lib/pdf-utils.ts" -ForegroundColor Cyan
    Write-Host "   Contenu: Fonctions generateReportCardPDF, generateCertificatePDF, generateAdvancedReportPDF" -ForegroundColor Cyan
    exit 1
}

Set-Content -Path "$root\lib\pdf-utils.ts" -Value $content
Write-Host "✅ lib/pdf-utils.ts créé" -ForegroundColor Green
