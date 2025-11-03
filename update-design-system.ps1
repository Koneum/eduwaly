# Script de mise à jour du Design System Schooly
# Remplace les anciennes classes de couleurs par le nouveau système

Write-Host "🎨 Mise à jour du Design System Schooly..." -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
$componentsPath = Join-Path $rootPath "components"
$appPath = Join-Path $rootPath "app"

# Compteurs
$filesUpdated = 0
$totalReplacements = 0

# Fonction pour mettre à jour un fichier
function Update-DesignSystem {
    param (
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $replacements = 0
    
    # Remplacement des couleurs Indigo par Jaune Solaire
    $content = $content -replace 'bg-indigo-600', 'bg-primary'
    $content = $content -replace 'bg-indigo-700', 'bg-primary hover:bg-[#E6B000]'
    $content = $content -replace 'bg-indigo-100', 'bg-primary/10'
    $content = $content -replace 'bg-indigo-50', 'bg-primary/5'
    $content = $content -replace 'text-indigo-600', 'text-primary'
    $content = $content -replace 'text-indigo-700', 'text-primary'
    $content = $content -replace 'border-indigo-600', 'border-primary'
    $content = $content -replace 'ring-indigo-500', 'ring-primary'
    $content = $content -replace 'focus:ring-indigo-500', 'focus:ring-primary'
    
    # Remplacement des textes par Bleu Profond
    $content = $content -replace 'text-gray-900(?![\w-])', 'text-foreground'
    $content = $content -replace 'text-gray-800', 'text-foreground'
    $content = $content -replace 'text-gray-700', 'text-muted-foreground'
    $content = $content -replace 'text-gray-600', 'text-muted-foreground'
    $content = $content -replace 'text-gray-500', 'text-muted-foreground'
    
    # Remplacement des backgrounds
    $content = $content -replace 'bg-white(?![\w-])', 'bg-card'
    $content = $content -replace 'bg-gray-50', 'bg-background'
    $content = $content -replace 'bg-gray-100', 'bg-muted'
    
    # Remplacement des bordures
    $content = $content -replace 'border-gray-300', 'border-border'
    $content = $content -replace 'border-gray-200', 'border-border'
    
    # Remplacement des boutons
    $content = $content -replace 'className="([^"]*?)bg-indigo-600([^"]*?)"', 'className="$1btn-primary$2"'
    
    # Remplacement des liens
    $content = $content -replace 'text-blue-600', 'text-[var(--link)]'
    $content = $content -replace 'hover:text-blue-700', 'hover:text-[var(--link-hover)]'
    
    # Remplacement des success badges
    $content = $content -replace 'bg-green-100 text-green-800', 'badge-success'
    $content = $content -replace 'bg-green-500', 'bg-success'
    
    # Compter les changements
    if ($content -ne $originalContent) {
        Set-Content $FilePath -Value $content -NoNewline
        $script:filesUpdated++
        return $true
    }
    
    return $false
}

# Parcourir tous les fichiers TSX et JSX
Write-Host "📁 Scan des composants..." -ForegroundColor Yellow
$files = Get-ChildItem -Path $rootPath -Include *.tsx,*.jsx,*.ts,*.js -Recurse -File | 
    Where-Object { $_.FullName -notmatch 'node_modules|\.next|\.git' }

$totalFiles = $files.Count
$currentFile = 0

foreach ($file in $files) {
    $currentFile++
    $percentComplete = [math]::Round(($currentFile / $totalFiles) * 100)
    
    Write-Progress -Activity "Mise à jour des fichiers" -Status "$currentFile / $totalFiles" -PercentComplete $percentComplete
    
    if (Update-DesignSystem -FilePath $file.FullName) {
        Write-Host "✅ $($file.Name)" -ForegroundColor Green
    }
}

Write-Progress -Activity "Mise à jour des fichiers" -Completed

Write-Host ""
Write-Host "✨ Mise à jour terminée!" -ForegroundColor Green
Write-Host "📊 Fichiers mis à jour: $filesUpdated / $totalFiles" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎨 Nouveau Design System appliqué:" -ForegroundColor Magenta
Write-Host "   • Jaune Solaire (#FFC300) - Boutons et éléments clés" -ForegroundColor Yellow
Write-Host "   • Bleu Profond (#2C3E50) - Textes et navigation" -ForegroundColor Blue
Write-Host "   • Bleu Roi (#0066CC) - Liens hypertextes" -ForegroundColor Cyan
Write-Host "   • Vert (#10B981) - Indicateurs de succès" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Vérifiez manuellement:" -ForegroundColor Yellow
Write-Host "   1. Les pages de connexion/inscription"
Write-Host "   2. Les dialogues modaux"
Write-Host "   3. Les graphiques et charts"
Write-Host "   4. La sidebar de navigation"
Write-Host ""
