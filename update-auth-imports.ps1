# Script de mise à jour des imports NextAuth v5
# Exécuter depuis la racine du projet: .\update-auth-imports.ps1

Write-Host "🔄 Mise à jour des imports NextAuth v5..." -ForegroundColor Cyan

# Trouver tous les fichiers TypeScript dans app/api
$files = Get-ChildItem -Path "app\api" -Filter "*.ts" -Recurse -ErrorAction SilentlyContinue

$updatedCount = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Vérifier si le fichier contient getServerSession
        if ($content -match "getServerSession") {
            Write-Host "📝 Mise à jour: $($file.Name)" -ForegroundColor Yellow
            
            # Pattern 1: Imports séparés
            $content = $content -replace "import \{ getServerSession \} from ['\`"]next-auth['\`"]\r?\n", ""
            $content = $content -replace "import \{ getServerSession \} from ['\`"]next-auth['\`"]", ""
            
            # Pattern 2: authOptions import
            $content = $content -replace "import \{ authOptions \} from ['\`"]@/lib/auth['\`"]", "import { auth } from '@/lib/auth'"
            
            # Pattern 3: Combined imports
            $content = $content -replace "import \{ getServerSession \} from ['\`"]next-auth['\`"]\r?\nimport \{ authOptions \} from ['\`"]@/lib/auth['\`"]", "import { auth } from '@/lib/auth'"
            
            # Remplacer les appels getServerSession
            $content = $content -replace "await getServerSession\(authOptions\)", "await auth()"
            $content = $content -replace "getServerSession\(authOptions\)", "auth()"
            
            # Nettoyer les lignes vides multiples
            $content = $content -replace "(\r?\n){3,}", "`r`n`r`n"
            
            # Sauvegarder seulement si le contenu a changé
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
                $updatedCount++
                Write-Host "  ✅ Mis à jour" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Aucun changement détecté" -ForegroundColor DarkYellow
            }
        }
    }
    catch {
        Write-Host "  ❌ Erreur: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Mise à jour terminée!" -ForegroundColor Green
Write-Host "📊 Fichiers mis à jour: $updatedCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Vérifiez manuellement quelques fichiers pour confirmer les changements." -ForegroundColor Yellow
