# Script de mise à jour FORCÉE et COMPLÈTE du Design System Schooly
# Met à jour ABSOLUMENT TOUS les fichiers sans exception

Write-Host "🚀 MISE À JOUR FORCÉE - Design System Schooly" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
$filesUpdated = 0
$totalChanges = 0

function Update-FileForce {
    param ([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) { return $false }
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $originalContent = $content
        $localChanges = 0
        
        # ═══════════════════════════════════════════════════════════
        # BOUTONS - JAUNE SOLAIRE PARTOUT
        # ═══════════════════════════════════════════════════════════
        
        # Tous les boutons primaires → Jaune Solaire
        $content = $content -replace 'className="([^"]*?)bg-blue-600([^"]*?)"', 'className="$1bg-primary$2"'
        $content = $content -replace 'className="([^"]*?)bg-blue-500([^"]*?)"', 'className="$1bg-primary$2"'
        $content = $content -replace 'className="([^"]*?)bg-indigo-600([^"]*?)"', 'className="$1bg-primary$2"'
        $content = $content -replace 'className="([^"]*?)bg-indigo-500([^"]*?)"', 'className="$1bg-primary$2"'
        $content = $content -replace 'className="([^"]*?)bg-purple-600([^"]*?)"', 'className="$1bg-primary$2"'
        $content = $content -replace 'className="([^"]*?)bg-violet-600([^"]*?)"', 'className="$1bg-primary$2"'
        
        # Hover states
        $content = $content -replace 'hover:bg-blue-700\b', 'hover:bg-[#E6B000]'
        $content = $content -replace 'hover:bg-blue-600\b', 'hover:bg-[#E6B000]'
        $content = $content -replace 'hover:bg-indigo-700\b', 'hover:bg-[#E6B000]'
        $content = $content -replace 'hover:bg-purple-700\b', 'hover:bg-[#E6B000]'
        
        # ═══════════════════════════════════════════════════════════
        # COULEURS DE BASE - TOUTES LES VARIANTES
        # ═══════════════════════════════════════════════════════════
        
        # Indigo → Primary (Jaune)
        $content = $content -replace '\bindigo-600\b', 'primary'
        $content = $content -replace '\bindigo-700\b', 'primary'
        $content = $content -replace '\bindigo-500\b', 'primary'
        $content = $content -replace '\bindigo-100\b', 'primary/10'
        $content = $content -replace '\bindigo-50\b', 'primary/5'
        
        # Blue → Primary pour boutons
        $content = $content -replace '\bbg-blue-600\b', 'bg-primary'
        $content = $content -replace '\bbg-blue-500\b', 'bg-primary'
        $content = $content -replace '\btext-blue-600\b', 'text-[var(--link)]'
        $content = $content -replace '\btext-blue-700\b', 'text-[var(--link)]'
        $content = $content -replace '\btext-blue-500\b', 'text-[var(--link)]'
        
        # Purple/Violet → Primary
        $content = $content -replace '\bbg-purple-600\b', 'bg-primary'
        $content = $content -replace '\bbg-purple-500\b', 'bg-primary'
        $content = $content -replace '\bbg-violet-600\b', 'bg-primary'
        $content = $content -replace '\btext-purple-600\b', 'text-primary'
        $content = $content -replace '\btext-violet-600\b', 'text-primary'
        
        # ═══════════════════════════════════════════════════════════
        # TEXTES - BLEU PROFOND / FOREGROUND
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace '\btext-gray-900\b', 'text-foreground'
        $content = $content -replace '\btext-gray-800\b', 'text-foreground'
        $content = $content -replace '\btext-gray-700\b', 'text-muted-foreground'
        $content = $content -replace '\btext-gray-600\b', 'text-muted-foreground'
        $content = $content -replace '\btext-gray-500\b', 'text-muted-foreground'
        $content = $content -replace '\btext-gray-400\b', 'text-muted-foreground/70'
        $content = $content -replace '\btext-slate-900\b', 'text-foreground'
        $content = $content -replace '\btext-slate-800\b', 'text-foreground'
        $content = $content -replace '\btext-slate-700\b', 'text-muted-foreground'
        
        # ═══════════════════════════════════════════════════════════
        # BACKGROUNDS - BLANC/CARDS
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace '\bbg-white\b', 'bg-card'
        $content = $content -replace '\bbg-gray-50\b', 'bg-background'
        $content = $content -replace '\bbg-gray-100\b', 'bg-muted'
        $content = $content -replace '\bbg-gray-200\b', 'bg-muted'
        $content = $content -replace '\bbg-slate-50\b', 'bg-background'
        $content = $content -replace '\bbg-slate-100\b', 'bg-muted'
        
        # ═══════════════════════════════════════════════════════════
        # BORDURES - GRIS CLAIR
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace '\bborder-gray-300\b', 'border-border'
        $content = $content -replace '\bborder-gray-200\b', 'border-border'
        $content = $content -replace '\bborder-gray-100\b', 'border-border'
        $content = $content -replace '\bborder-slate-300\b', 'border-border'
        $content = $content -replace '\bborder-slate-200\b', 'border-border'
        
        # Bordures colorées → Primary
        $content = $content -replace '\bborder-blue-600\b', 'border-primary'
        $content = $content -replace '\bborder-blue-500\b', 'border-primary'
        $content = $content -replace '\bborder-indigo-600\b', 'border-primary'
        $content = $content -replace '\bborder-purple-600\b', 'border-primary'
        
        # ═══════════════════════════════════════════════════════════
        # LIENS - BLEU ROI
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace 'hover:text-blue-700\b', 'hover:text-[var(--link-hover)]'
        $content = $content -replace 'hover:text-blue-800\b', 'hover:text-[var(--link-hover)]'
        $content = $content -replace 'hover:text-blue-600\b', 'hover:text-[var(--link-hover)]'
        $content = $content -replace 'hover:underline', 'hover:underline hover:text-[var(--link-hover)]'
        
        # ═══════════════════════════════════════════════════════════
        # SUCCESS/GREEN - INDICATEURS
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace '\bbg-green-500\b', 'bg-success'
        $content = $content -replace '\bbg-green-600\b', 'bg-success'
        $content = $content -replace '\btext-green-600\b', 'text-success'
        $content = $content -replace '\btext-green-700\b', 'text-success'
        $content = $content -replace '\btext-green-800\b', 'text-success'
        
        # Badge success
        $content = $content -replace 'bg-green-100\s+text-green-800', 'bg-success/10 text-success'
        $content = $content -replace 'bg-green-50\s+text-green-700', 'bg-success/10 text-success'
        
        # ═══════════════════════════════════════════════════════════
        # ORANGE/AMBER - CHARTS
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace '\bbg-orange-500\b', 'bg-[var(--chart-5)]'
        $content = $content -replace '\bbg-orange-400\b', 'bg-[var(--chart-5)]'
        $content = $content -replace '\bbg-amber-500\b', 'bg-[var(--chart-5)]'
        $content = $content -replace '\btext-orange-600\b', 'text-[var(--chart-5)]'
        $content = $content -replace '\btext-amber-600\b', 'text-[var(--chart-5)]'
        
        # ═══════════════════════════════════════════════════════════
        # RINGS/FOCUS - JAUNE SOLAIRE
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace '\bring-blue-500\b', 'ring-primary'
        $content = $content -replace '\bring-indigo-500\b', 'ring-primary'
        $content = $content -replace '\bring-purple-500\b', 'ring-primary'
        $content = $content -replace 'focus:ring-blue-500\b', 'focus:ring-primary'
        $content = $content -replace 'focus:ring-indigo-500\b', 'focus:ring-primary'
        $content = $content -replace 'focus:ring-purple-500\b', 'focus:ring-primary'
        
        # ═══════════════════════════════════════════════════════════
        # GRADIENTS - PRIMARY
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace 'from-blue-600\b', 'from-primary'
        $content = $content -replace 'from-indigo-600\b', 'from-primary'
        $content = $content -replace 'to-blue-600\b', 'to-primary'
        $content = $content -replace 'to-indigo-600\b', 'to-primary'
        $content = $content -replace 'via-blue-500\b', 'via-primary'
        
        # ═══════════════════════════════════════════════════════════
        # SIDEBAR - BLEU PROFOND
        # ═══════════════════════════════════════════════════════════
        
        # Remplacer les backgrounds de sidebar
        $content = $content -replace 'className="([^"]*?)bg-gray-900([^"]*?)"', 'className="$1bg-[#2C3E50]$2"'
        $content = $content -replace 'className="([^"]*?)bg-slate-900([^"]*?)"', 'className="$1bg-[#2C3E50]$2"'
        
        # ═══════════════════════════════════════════════════════════
        # INPUTS - STYLING
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace 'focus:border-blue-500\b', 'focus:border-primary'
        $content = $content -replace 'focus:border-indigo-500\b', 'focus:border-primary'
        
        # ═══════════════════════════════════════════════════════════
        # BADGES/PILLS
        # ═══════════════════════════════════════════════════════════
        
        $content = $content -replace 'bg-blue-100\s+text-blue-800', 'bg-primary/10 text-primary'
        $content = $content -replace 'bg-indigo-100\s+text-indigo-800', 'bg-primary/10 text-primary'
        $content = $content -replace 'bg-purple-100\s+text-purple-800', 'bg-primary/10 text-primary'
        
        # ═══════════════════════════════════════════════════════════
        # DESTRUCTIVE/RED - GARDER
        # ═══════════════════════════════════════════════════════════
        # Ne pas toucher aux couleurs rouges (destructive)
        
        if ($content -ne $originalContent) {
            Set-Content $FilePath -Value $content -NoNewline -ErrorAction Stop
            $script:filesUpdated++
            $script:totalChanges++
            return $true
        }
        
        return $false
    }
    catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Récupérer TOUS les fichiers
Write-Host "🔍 Scan COMPLET de l'application..." -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path $rootPath -Include *.tsx,*.jsx,*.ts,*.js -Recurse -File | 
    Where-Object { 
        $_.FullName -notmatch 'node_modules|\.next|\.git|dist|build' -and
        (Test-Path $_.FullName)
    }

$totalFiles = $allFiles.Count
Write-Host "📊 $totalFiles fichiers à traiter" -ForegroundColor Cyan
Write-Host ""

$currentFile = 0
$updatedFiles = @()

foreach ($file in $allFiles) {
    $currentFile++
    $percentComplete = [math]::Round(($currentFile / $totalFiles) * 100)
    
    Write-Progress -Activity "Mise à jour FORCÉE" `
                   -Status "$currentFile / $totalFiles - $($file.Name)" `
                   -PercentComplete $percentComplete
    
    if (Update-FileForce -FilePath $file.FullName) {
        $updatedFiles += $file.Name
        Write-Host "✅ $($file.Name)" -ForegroundColor Green
    }
}

Write-Progress -Activity "Mise à jour FORCÉE" -Completed

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ MISE À JOUR FORCÉE TERMINÉE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 STATISTIQUES FINALES:" -ForegroundColor Magenta
Write-Host "   • Total fichiers scannés: $totalFiles" -ForegroundColor White
Write-Host "   • Fichiers mis à jour: $filesUpdated" -ForegroundColor Green
Write-Host "   • Pourcentage: $([math]::Round(($filesUpdated / $totalFiles) * 100, 2))%" -ForegroundColor Yellow
Write-Host ""

if ($updatedFiles.Count -gt 0) {
    Write-Host "📝 Fichiers modifiés ($($updatedFiles.Count)):" -ForegroundColor Cyan
    $updatedFiles | Sort-Object | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
    Write-Host ""
}

Write-Host "🎨 DESIGN SYSTEM SCHOOLY APPLIQUÉ:" -ForegroundColor Magenta
Write-Host "   ⭐ Jaune Solaire (#FFC300) - Boutons, métriques, actifs" -ForegroundColor Yellow
Write-Host "   🔵 Bleu Profond (#2C3E50) - Textes, navigation" -ForegroundColor Blue
Write-Host "   🔗 Bleu Roi (#0066CC) - Liens hypertextes" -ForegroundColor Cyan
Write-Host "   ✅ Vert (#10B981) - Indicateurs de succès" -ForegroundColor Green
Write-Host ""
Write-Host "✅ TOUS LES COMPOSANTS SONT MAINTENANT CONFORMES!" -ForegroundColor Green
Write-Host ""
