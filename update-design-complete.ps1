# Script de mise à jour COMPLÈTE du Design System Schooly
# Scanne et met à jour TOUS les fichiers TSX/JSX existants

Write-Host "🎨 Mise à jour COMPLÈTE du Design System Schooly..." -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
$filesUpdated = 0
$totalChanges = 0

# Fonction pour mettre à jour un fichier
function Update-File {
    param (
        [string]$FilePath
    )
    
    if (-not (Test-Path $FilePath)) {
        return $false
    }
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $originalContent = $content
        $changes = 0
        
        # === COULEURS INDIGO → JAUNE SOLAIRE ===
        if ($content -match 'indigo') {
            $content = $content -replace 'bg-indigo-600\b', 'bg-primary'
            $content = $content -replace 'bg-indigo-700\b', 'bg-primary hover:bg-[#E6B000]'
            $content = $content -replace 'bg-indigo-500\b', 'bg-primary'
            $content = $content -replace 'bg-indigo-100\b', 'bg-primary/10'
            $content = $content -replace 'bg-indigo-50\b', 'bg-primary/5'
            $content = $content -replace 'text-indigo-600\b', 'text-primary'
            $content = $content -replace 'text-indigo-700\b', 'text-primary'
            $content = $content -replace 'text-indigo-500\b', 'text-primary'
            $content = $content -replace 'border-indigo-600\b', 'border-primary'
            $content = $content -replace 'border-indigo-500\b', 'border-primary'
            $content = $content -replace 'ring-indigo-500\b', 'ring-primary'
            $content = $content -replace 'focus:ring-indigo-500\b', 'focus:ring-primary'
            $content = $content -replace 'from-indigo-600\b', 'from-primary'
            $content = $content -replace 'to-indigo-600\b', 'to-primary'
            $changes++
        }
        
        # === TEXTES GRIS → FOREGROUND/MUTED ===
        if ($content -match 'text-gray-9') {
            $content = $content -replace 'text-gray-900\b', 'text-foreground'
            $content = $content -replace 'text-gray-800\b', 'text-foreground'
            $changes++
        }
        if ($content -match 'text-gray-[567]') {
            $content = $content -replace 'text-gray-700\b', 'text-muted-foreground'
            $content = $content -replace 'text-gray-600\b', 'text-muted-foreground'
            $content = $content -replace 'text-gray-500\b', 'text-muted-foreground'
            $changes++
        }
        
        # === BACKGROUNDS BLANCS/GRIS ===
        if ($content -match 'bg-white\b') {
            $content = $content -replace 'bg-white\b', 'bg-card'
            $changes++
        }
        if ($content -match 'bg-gray-[15]') {
            $content = $content -replace 'bg-gray-50\b', 'bg-background'
            $content = $content -replace 'bg-gray-100\b', 'bg-muted'
            $changes++
        }
        
        # === BORDURES ===
        if ($content -match 'border-gray-[23]') {
            $content = $content -replace 'border-gray-300\b', 'border-border'
            $content = $content -replace 'border-gray-200\b', 'border-border'
            $changes++
        }
        
        # === LIENS BLEUS → BLEU ROI ===
        if ($content -match 'text-blue-[67]') {
            $content = $content -replace 'text-blue-600\b', 'text-[var(--link)]'
            $content = $content -replace 'text-blue-700\b', 'text-[var(--link)]'
            $content = $content -replace 'hover:text-blue-700\b', 'hover:text-[var(--link-hover)]'
            $content = $content -replace 'hover:text-blue-800\b', 'hover:text-[var(--link-hover)]'
            $changes++
        }
        
        # === SUCCESS/GREEN ===
        if ($content -match 'green-[15]') {
            $content = $content -replace 'bg-green-100\s+text-green-800', 'badge-success'
            $content = $content -replace 'bg-green-500\b', 'bg-success'
            $content = $content -replace 'text-green-600\b', 'text-success'
            $changes++
        }
        
        # === PURPLE/VIOLET → PRIMARY ===
        if ($content -match 'purple-[56]|violet-[56]') {
            $content = $content -replace 'bg-purple-600\b', 'bg-primary'
            $content = $content -replace 'bg-purple-500\b', 'bg-primary'
            $content = $content -replace 'bg-violet-600\b', 'bg-primary'
            $content = $content -replace 'text-purple-600\b', 'text-primary'
            $content = $content -replace 'text-violet-600\b', 'text-primary'
            $changes++
        }
        
        # === ORANGE → CHART COLOR ===
        if ($content -match 'orange-[45]') {
            $content = $content -replace 'bg-orange-500\b', 'bg-[var(--chart-5)]'
            $content = $content -replace 'bg-orange-400\b', 'bg-[var(--chart-5)]'
            $content = $content -replace 'text-orange-600\b', 'text-[var(--chart-5)]'
            $changes++
        }
        
        # Sauvegarder si modifié
        if ($content -ne $originalContent) {
            Set-Content $FilePath -Value $content -NoNewline -ErrorAction Stop
            $script:filesUpdated++
            $script:totalChanges += $changes
            return $true
        }
        
        return $false
    }
    catch {
        Write-Host "❌ Erreur sur $($FilePath): $_" -ForegroundColor Red
        return $false
    }
}

# Récupérer TOUS les fichiers TSX/JSX
Write-Host "📁 Scan de tous les fichiers..." -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path $rootPath -Include *.tsx,*.jsx -Recurse -File | 
    Where-Object { 
        $_.FullName -notmatch 'node_modules|\.next|\.git' -and
        (Test-Path $_.FullName)
    }

$totalFiles = $allFiles.Count
Write-Host "📊 $totalFiles fichiers trouvés" -ForegroundColor Cyan
Write-Host ""

$currentFile = 0
$updatedFiles = @()

foreach ($file in $allFiles) {
    $currentFile++
    $percentComplete = [math]::Round(($currentFile / $totalFiles) * 100)
    
    Write-Progress -Activity "Mise à jour des fichiers" `
                   -Status "$currentFile / $totalFiles - $($file.Name)" `
                   -PercentComplete $percentComplete
    
    if (Update-File -FilePath $file.FullName) {
        $updatedFiles += $file.Name
        Write-Host "✅ $($file.Name)" -ForegroundColor Green
    }
}

Write-Progress -Activity "Mise à jour des fichiers" -Completed

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Mise à jour terminée!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Statistiques:" -ForegroundColor Magenta
Write-Host "   • Fichiers scannés: $totalFiles" -ForegroundColor White
Write-Host "   • Fichiers mis à jour: $filesUpdated" -ForegroundColor Green
Write-Host "   • Total de changements: $totalChanges" -ForegroundColor Yellow
Write-Host ""

if ($updatedFiles.Count -gt 0) {
    Write-Host "📝 Fichiers modifiés:" -ForegroundColor Cyan
    $updatedFiles | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
    Write-Host ""
}

Write-Host "🎨 Nouveau Design System appliqué:" -ForegroundColor Magenta
Write-Host "   • Jaune Solaire (#FFC300) - Boutons et éléments clés" -ForegroundColor Yellow
Write-Host "   • Bleu Profond (#2C3E50) - Textes et navigation" -ForegroundColor Blue
Write-Host "   • Bleu Roi (#0066CC) - Liens hypertextes" -ForegroundColor Cyan
Write-Host "   • Vert (#10B981) - Indicateurs de succès" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Vérifications manuelles recommandées:" -ForegroundColor Yellow
Write-Host "   1. Pages de connexion/inscription" -ForegroundColor White
Write-Host "   2. Dialogues et modals" -ForegroundColor White
Write-Host "   3. Graphiques (recharts/charts)" -ForegroundColor White
Write-Host "   4. Sidebar de navigation" -ForegroundColor White
Write-Host "   5. Composants UI personnalisés" -ForegroundColor White
Write-Host ""
Write-Host "✅ Design System Schooly prêt!" -ForegroundColor Green
Write-Host ""
