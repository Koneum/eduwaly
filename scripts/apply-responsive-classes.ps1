# Script de Migration Responsive - Application Schooly
# Applique les nouvelles classes responsive à tous les composants
# Date: 8 novembre 2025

Write-Host "🚀 SCRIPT DE MIGRATION RESPONSIVE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour appliquer les remplacements dans un fichier
function Apply-ResponsiveClasses {
    param (
        [string]$FilePath
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "⚠️  Fichier introuvable: $FilePath" -ForegroundColor Yellow
        return
    }
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $modified = $false
    
    # REMPLACEMENTS TEXTE
    # text-xs sm:text-sm md:text-base → text-responsive-sm
    if ($content -match 'text-xs\s+sm:text-sm\s+md:text-base') {
        $content = $content -replace 'text-xs\s+sm:text-sm\s+md:text-base', 'text-responsive-sm'
        $modified = $true
    }
    
    # text-sm sm:text-base md:text-lg → text-responsive-base
    if ($content -match 'text-sm\s+sm:text-base\s+md:text-lg') {
        $content = $content -replace 'text-sm\s+sm:text-base\s+md:text-lg', 'text-responsive-base'
        $modified = $true
    }
    
    # text-base sm:text-lg md:text-xl → text-responsive-lg
    if ($content -match 'text-base\s+sm:text-lg\s+md:text-xl') {
        $content = $content -replace 'text-base\s+sm:text-lg\s+md:text-xl', 'text-responsive-lg'
        $modified = $true
    }
    
    # text-lg sm:text-xl md:text-2xl → text-responsive-xl
    if ($content -match 'text-lg\s+sm:text-xl\s+md:text-2xl') {
        $content = $content -replace 'text-lg\s+sm:text-xl\s+md:text-2xl', 'text-responsive-xl'
        $modified = $true
    }
    
    # text-xl sm:text-2xl md:text-3xl → text-responsive-2xl
    if ($content -match 'text-xl\s+sm:text-2xl\s+md:text-3xl') {
        $content = $content -replace 'text-xl\s+sm:text-2xl\s+md:text-3xl', 'text-responsive-2xl'
        $modified = $true
    }
    
    # text-2xl sm:text-3xl md:text-4xl → text-responsive-3xl
    if ($content -match 'text-2xl\s+sm:text-3xl\s+md:text-4xl') {
        $content = $content -replace 'text-2xl\s+sm:text-3xl\s+md:text-4xl', 'text-responsive-3xl'
        $modified = $true
    }
    
    # REMPLACEMENTS HEADINGS
    # text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold → heading-responsive-h1
    if ($content -match 'text-2xl\s+sm:text-3xl\s+md:text-4xl\s+lg:text-5xl\s+font-bold') {
        $content = $content -replace 'text-2xl\s+sm:text-3xl\s+md:text-4xl\s+lg:text-5xl\s+font-bold', 'heading-responsive-h1'
        $modified = $true
    }
    
    # text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold → heading-responsive-h2
    if ($content -match 'text-xl\s+sm:text-2xl\s+md:text-3xl\s+lg:text-4xl\s+font-bold') {
        $content = $content -replace 'text-xl\s+sm:text-2xl\s+md:text-3xl\s+lg:text-4xl\s+font-bold', 'heading-responsive-h2'
        $modified = $true
    }
    
    # text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold → heading-responsive-h3
    if ($content -match 'text-lg\s+sm:text-xl\s+md:text-2xl\s+lg:text-3xl\s+font-semibold') {
        $content = $content -replace 'text-lg\s+sm:text-xl\s+md:text-2xl\s+lg:text-3xl\s+font-semibold', 'heading-responsive-h3'
        $modified = $true
    }
    
    # REMPLACEMENTS PADDING
    # p-2 sm:p-4 md:p-6 lg:p-8 → p-responsive
    if ($content -match 'p-2\s+sm:p-4\s+md:p-6\s+lg:p-8') {
        $content = $content -replace 'p-2\s+sm:p-4\s+md:p-6\s+lg:p-8', 'p-responsive'
        $modified = $true
    }
    
    # px-2 sm:px-4 md:px-6 lg:px-8 → px-responsive
    if ($content -match 'px-2\s+sm:px-4\s+md:px-6\s+lg:px-8') {
        $content = $content -replace 'px-2\s+sm:px-4\s+md:px-6\s+lg:px-8', 'px-responsive'
        $modified = $true
    }
    
    # py-2 sm:py-4 md:py-6 lg:py-8 → py-responsive
    if ($content -match 'py-2\s+sm:py-4\s+md:py-6\s+lg:py-8') {
        $content = $content -replace 'py-2\s+sm:py-4\s+md:py-6\s+lg:py-8', 'py-responsive'
        $modified = $true
    }
    
    # REMPLACEMENTS MARGIN
    # m-2 sm:m-4 md:m-6 lg:m-8 → m-responsive
    if ($content -match 'm-2\s+sm:m-4\s+md:m-6\s+lg:m-8') {
        $content = $content -replace 'm-2\s+sm:m-4\s+md:m-6\s+lg:m-8', 'm-responsive'
        $modified = $true
    }
    
    # mx-2 sm:mx-4 md:mx-6 lg:mx-8 → mx-responsive
    if ($content -match 'mx-2\s+sm:mx-4\s+md:mx-6\s+lg:mx-8') {
        $content = $content -replace 'mx-2\s+sm:mx-4\s+md:mx-6\s+lg:mx-8', 'mx-responsive'
        $modified = $true
    }
    
    # my-2 sm:my-4 md:my-6 lg:my-8 → my-responsive
    if ($content -match 'my-2\s+sm:my-4\s+md:my-6\s+lg:my-8') {
        $content = $content -replace 'my-2\s+sm:my-4\s+md:my-6\s+lg:my-8', 'my-responsive'
        $modified = $true
    }
    
    # REMPLACEMENTS GAP
    # gap-2 sm:gap-4 md:gap-6 lg:gap-8 → gap-responsive
    if ($content -match 'gap-2\s+sm:gap-4\s+md:gap-6\s+lg:gap-8') {
        $content = $content -replace 'gap-2\s+sm:gap-4\s+md:gap-6\s+lg:gap-8', 'gap-responsive'
        $modified = $true
    }
    
    # REMPLACEMENTS GRID
    # grid grid-cols-1 sm:grid-cols-2 gap-4 → grid-responsive-2
    if ($content -match 'grid\s+grid-cols-1\s+sm:grid-cols-2\s+gap-4') {
        $content = $content -replace 'grid\s+grid-cols-1\s+sm:grid-cols-2\s+gap-4', 'grid-responsive-2'
        $modified = $true
    }
    
    # grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 → grid-responsive-3
    if ($content -match 'grid\s+grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-3\s+gap-4') {
        $content = $content -replace 'grid\s+grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-3\s+gap-4', 'grid-responsive-3'
        $modified = $true
    }
    
    # grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 → grid-responsive-4
    if ($content -match 'grid\s+grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-3\s+xl:grid-cols-4\s+gap-4') {
        $content = $content -replace 'grid\s+grid-cols-1\s+sm:grid-cols-2\s+lg:grid-cols-3\s+xl:grid-cols-4\s+gap-4', 'grid-responsive-4'
        $modified = $true
    }
    
    # REMPLACEMENTS SIMPLES (text-sm seul → text-responsive-sm dans certains contextes)
    # Labels
    if ($content -match '<Label[^>]*className="([^"]*\s)?text-sm(\s[^"]*)?">') {
        $content = $content -replace '(<Label[^>]*className="[^"]*?)text-sm(\s)', '$1text-responsive-sm$2'
        $modified = $true
    }
    
    # DialogTitle avec text-lg
    if ($content -match '<DialogTitle[^>]*className="([^"]*\s)?text-lg(\s[^"]*)?">') {
        $content = $content -replace '(<DialogTitle[^>]*className="[^"]*?)text-lg(\s)', '$1text-responsive-lg$2'
        $modified = $true
    }
    
    # DialogDescription avec text-sm
    if ($content -match '<DialogDescription[^>]*className="([^"]*\s)?text-sm(\s[^"]*)?">') {
        $content = $content -replace '(<DialogDescription[^>]*className="[^"]*?)text-sm(\s)', '$1text-responsive-sm$2'
        $modified = $true
    }
    
    # CardTitle avec text-lg ou text-xl
    if ($content -match '<CardTitle[^>]*className="([^"]*\s)?text-lg(\s[^"]*)?">') {
        $content = $content -replace '(<CardTitle[^>]*className="[^"]*?)text-lg(\s)', '$1text-responsive-lg$2'
        $modified = $true
    }
    
    if ($content -match '<CardTitle[^>]*className="([^"]*\s)?text-xl(\s[^"]*)?">') {
        $content = $content -replace '(<CardTitle[^>]*className="[^"]*?)text-xl(\s)', '$1text-responsive-xl$2'
        $modified = $true
    }
    
    # CardDescription avec text-sm
    if ($content -match '<CardDescription[^>]*className="([^"]*\s)?text-sm(\s[^"]*)?">') {
        $content = $content -replace '(<CardDescription[^>]*className="[^"]*?)text-sm(\s)', '$1text-responsive-sm$2'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $FilePath -Value $content -NoNewline
        Write-Host "✅ Modifié: $FilePath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⏭️  Aucun changement: $FilePath" -ForegroundColor Gray
        return $false
    }
}

# Fonction pour traiter récursivement un dossier
function Process-Directory {
    param (
        [string]$Path,
        [string]$Pattern = "*.tsx"
    )
    
    $files = Get-ChildItem -Path $Path -Filter $Pattern -Recurse -File
    $totalFiles = $files.Count
    $modifiedFiles = 0
    
    Write-Host ""
    Write-Host "📁 Traitement de: $Path" -ForegroundColor Cyan
    Write-Host "   Fichiers trouvés: $totalFiles" -ForegroundColor White
    Write-Host ""
    
    foreach ($file in $files) {
        $result = Apply-ResponsiveClasses -FilePath $file.FullName
        if ($result) {
            $modifiedFiles++
        }
    }
    
    Write-Host ""
    Write-Host "📊 Résumé: $modifiedFiles/$totalFiles fichiers modifiés" -ForegroundColor $(if ($modifiedFiles -gt 0) { "Green" } else { "Yellow" })
    Write-Host ""
    
    return @{
        Total = $totalFiles
        Modified = $modifiedFiles
    }
}

# Chemins à traiter
$basePath = "d:\react\UE-GI app\schooly"

$directories = @(
    # Components
    "$basePath\components\school-admin",
    "$basePath\components\student",
    "$basePath\components\super-admin",
    "$basePath\components\teacher",
    "$basePath\components\admin",
    "$basePath\components\announcements",
    "$basePath\components\messages",
    "$basePath\components\notifications",
    "$basePath\components\pricing",
    "$basePath\components\reports",
    "$basePath\components\parent",
    
    # App routes
    "$basePath\app\(auth)",
    "$basePath\app\admin\[schoolId]",
    "$basePath\app\enroll",
    "$basePath\app\messages",
    "$basePath\app\parent",
    "$basePath\app\pricing",
    "$basePath\app\student",
    "$basePath\app\super-admin",
    "$basePath\app\teacher"
)

# Statistiques globales
$globalStats = @{
    TotalFiles = 0
    ModifiedFiles = 0
    Directories = 0
}

Write-Host ""
Write-Host "🎯 DÉBUT DE LA MIGRATION" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        $stats = Process-Directory -Path $dir
        $globalStats.TotalFiles += $stats.Total
        $globalStats.ModifiedFiles += $stats.Modified
        $globalStats.Directories++
    } else {
        Write-Host "⚠️  Dossier introuvable: $dir" -ForegroundColor Yellow
    }
}

# Résumé final
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 MIGRATION TERMINÉE" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 STATISTIQUES GLOBALES:" -ForegroundColor White
Write-Host "   Dossiers traités: $($globalStats.Directories)" -ForegroundColor White
Write-Host "   Fichiers analysés: $($globalStats.TotalFiles)" -ForegroundColor White
Write-Host "   Fichiers modifiés: $($globalStats.ModifiedFiles)" -ForegroundColor Green
Write-Host ""

if ($globalStats.ModifiedFiles -gt 0) {
    Write-Host "✅ Migration réussie!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
    Write-Host "   1. Vérifier les modifications avec: git diff" -ForegroundColor White
    Write-Host "   2. Tester l'application: npm run dev" -ForegroundColor White
    Write-Host "   3. Build de production: npm run build" -ForegroundColor White
    Write-Host "   4. Commit les changements si tout fonctionne" -ForegroundColor White
} else {
    Write-Host "⚠️  Aucune modification appliquée" -ForegroundColor Yellow
    Write-Host "   Les fichiers utilisent peut-être déjà les classes responsive" -ForegroundColor White
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
