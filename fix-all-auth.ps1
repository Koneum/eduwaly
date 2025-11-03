# Script pour corriger TOUS les fichiers API avec les anciennes méthodes d'auth

Write-Host "Recherche de tous les fichiers avec import auth..." -ForegroundColor Cyan

# Trouver tous les fichiers route.ts dans app/api
$files = Get-ChildItem -Path "app\api" -Filter "route.ts" -Recurse -File

$corrected = 0
$skipped = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if (!$content) {
        continue
    }
    
    # Vérifier si le fichier contient les anciens imports
    if ($content -match "from '@/lib/auth'" -or $content -match "from 'next-auth'") {
        
        $modified = $false
        
        # Remplacer les imports
        if ($content -match "import \{ auth \} from '@/lib/auth'") {
            $content = $content -replace "import \{ auth \} from '@/lib/auth'", "import { getAuthUser } from '@/lib/auth-utils'"
            $modified = $true
        }
        
        if ($content -match "import \{ getServerSession \} from 'next-auth'") {
            $content = $content -replace "import \{ getServerSession \} from 'next-auth'\r?\n", ""
            $modified = $true
        }
        
        if ($content -match "import \{ authOptions \} from '@/lib/auth'") {
            $content = $content -replace "import \{ authOptions \} from '@/lib/auth'", "import { getAuthUser } from '@/lib/auth-utils'"
            $modified = $true
        }
        
        # Remplacer les appels
        if ($content -match "const session = await auth\(\)") {
            $content = $content -replace "const session = await auth\(\)", "const user = await getAuthUser()"
            $modified = $true
        }
        
        if ($content -match "const session = await getServerSession\(authOptions\)") {
            $content = $content -replace "const session = await getServerSession\(authOptions\)", "const user = await getAuthUser()"
            $modified = $true
        }
        
        # Remplacer les vérifications
        if ($content -match "if \(!session\?\.user\)") {
            $content = $content -replace "if \(!session\?\.user\)", "if (!user)"
            $modified = $true
        }
        
        if ($content -match "session\.user\.role") {
            $content = $content -replace "session\.user\.role", "user.role"
            $modified = $true
        }
        
        if ($content -match "session\.user\.schoolId") {
            $content = $content -replace "session\.user\.schoolId", "user.schoolId"
            $modified = $true
        }
        
        if ($content -match "session\.user\.id") {
            $content = $content -replace "session\.user\.id", "user.id"
            $modified = $true
        }
        
        if ($content -match "session\.user") {
            $content = $content -replace "session\.user", "user"
            $modified = $true
        }
        
        if ($modified) {
            # Sauvegarder
            Set-Content $file.FullName -Value $content -NoNewline
            $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
            Write-Host "✓ Corrigé: $relativePath" -ForegroundColor Green
            $corrected++
        } else {
            $skipped++
        }
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "$corrected fichiers corrigés" -ForegroundColor Green
Write-Host "$skipped fichiers ignorés" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
