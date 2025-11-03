# Script de vérification de l'intégration du système de Reporting
# Vérifie que tous les fichiers sont en place et les liens de navigation

Write-Host ""
Write-Host "🔍 VÉRIFICATION DU SYSTÈME DE REPORTING" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$root = "d:\react\UE-GI app\schooly"
$allGood = $true

# Fichiers à vérifier
$files = @(
    @{ Path = "types\reporting.ts"; Name = "Types TypeScript" },
    @{ Path = "lib\pdf-utils.ts"; Name = "Utilitaires PDF" },
    @{ Path = "app\api\reports\report-card\route.ts"; Name = "API Bulletins" },
    @{ Path = "app\api\reports\certificate\route.ts"; Name = "API Certificats" },
    @{ Path = "app\api\reports\advanced\route.ts"; Name = "API Rapports Avancés" },
    @{ Path = "components\reports\ReportCardGenerator.tsx"; Name = "Composant Bulletins" },
    @{ Path = "components\reports\CertificateGenerator.tsx"; Name = "Composant Certificats" },
    @{ Path = "components\reports\AdvancedReportsManager.tsx"; Name = "Composant Rapports" },
    @{ Path = "app\admin\[schoolId]\reports\page.tsx"; Name = "Page Admin Reports" },
    @{ Path = "app\teacher\[schoolId]\reports\page.tsx"; Name = "Page Teacher Reports" },
    @{ Path = "docs\REPORTING_SYSTEM.md"; Name = "Documentation" }
)

Write-Host "📁 Vérification des fichiers..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $root $file.Path
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($file.Name) - MANQUANT" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "🔗 Vérification de l'intégration navigation..." -ForegroundColor Yellow
Write-Host ""

# Vérifier admin-school-nav.tsx
$adminNav = Get-Content "$root\components\admin-school-nav.tsx" -Raw
if ($adminNav -match "Rapports & Documents" -and $adminNav -match "/admin/\$\{schoolId\}/reports") {
    Write-Host "  ✅ Navigation Admin - Lien présent" -ForegroundColor Green
} else {
    Write-Host "  ❌ Navigation Admin - Lien manquant" -ForegroundColor Red
    $allGood = $false
}

# Vérifier teacher-nav.tsx
$teacherNav = Get-Content "$root\components\teacher-nav.tsx" -Raw
if ($teacherNav -match "Rapports & Documents" -and $teacherNav -match "/teacher/\$\{schoolId\}/reports") {
    Write-Host "  ✅ Navigation Teacher - Lien présent" -ForegroundColor Green
} else {
    Write-Host "  ❌ Navigation Teacher - Lien manquant" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
Write-Host ""

# Vérifier package.json
$packageJson = Get-Content "$root\package.json" -Raw | ConvertFrom-Json
$deps = $packageJson.dependencies

if ($deps.jspdf) {
    Write-Host "  ✅ jsPDF installé (v$($deps.jspdf))" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  jsPDF non trouvé - À installer: npm install jspdf" -ForegroundColor Yellow
    $allGood = $false
}

if ($deps.'jspdf-autotable') {
    Write-Host "  ✅ jsPDF-AutoTable installé (v$($deps.'jspdf-autotable'))" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  jsPDF-AutoTable non trouvé - À installer: npm install jspdf-autotable" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ TOUT EST EN ORDRE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Le système de reporting est prêt à être utilisé:" -ForegroundColor Cyan
    Write-Host "   • Admin: http://localhost:3000/admin/[schoolId]/reports" -ForegroundColor White
    Write-Host "   • Teacher: http://localhost:3000/teacher/[schoolId]/reports" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation: docs/REPORTING_SYSTEM.md" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  PROBLÈMES DÉTECTÉS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Veuillez corriger les erreurs ci-dessus avant d'utiliser le système." -ForegroundColor Yellow
}

Write-Host ""
