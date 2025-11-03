# Script de génération des fichiers pour le système de Reporting
# Bulletins, Certificats, Rapports statistiques
# Date: 2 novembre 2025

Write-Host "🚀 Génération des fichiers de Reporting..." -ForegroundColor Cyan

$root = "d:\react\UE-GI app\schooly"
$created = 0

# Créer les dossiers nécessaires
$folders = @(
    "$root\types",
    "$root\app\api\reports\report-card",
    "$root\app\api\reports\certificate",
    "$root\app\api\reports\advanced",
    "$root\app\admin\[schoolId]\reports",
    "$root\app\teacher\[schoolId]\reports",
    "$root\components\reports"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
        Write-Host "  📁 Dossier créé: $folder" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Structure de dossiers créée" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Exécutez maintenant les scripts suivants dans l'ordre:" -ForegroundColor Yellow
Write-Host "   1. .\scripts\reporting\01-create-types.ps1" -ForegroundColor Cyan
Write-Host "   2. .\scripts\reporting\02-create-pdf-utils.ps1" -ForegroundColor Cyan
Write-Host "   3. .\scripts\reporting\03-create-apis.ps1" -ForegroundColor Cyan
Write-Host "   4. .\scripts\reporting\04-create-components.ps1" -ForegroundColor Cyan
Write-Host "   5. .\scripts\reporting\05-create-pages.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Ou exécutez: .\scripts\reporting\run-all.ps1" -ForegroundColor Yellow
