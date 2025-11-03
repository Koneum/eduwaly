# Corriger les fichiers avec auth.api.getSession

$files = @(
    "app\api\admin\staff\[id]\route.ts",
    "app\api\admin\permissions\route.ts",
    "app\api\admin\staff\route.ts"
)

$corrected = 0

foreach ($filePath in $files) {
    $fullPath = "d:\react\UE-GI app\schooly\$filePath"
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Retirer l'import headers si présent
        $content = $content -replace "import \{ headers \} from 'next/headers'\r?\n", ""
        
        # Remplacer auth.api.getSession par getAuthUser
        $content = $content -replace "const session = await auth\.api\.getSession\(\{[^}]+\}\)", "const user = await getAuthUser()"
        
        # Remplacer les vérifications
        $content = $content -replace "if \(!user\)", "if (!user)"
        
        Set-Content $fullPath -Value $content -NoNewline
        Write-Host "✓ Corrigé: $filePath" -ForegroundColor Green
        $corrected++
    } else {
        Write-Host "✗ Non trouvé: $filePath" -ForegroundColor Yellow
    }
}

Write-Host "`n$corrected fichiers corrigés!" -ForegroundColor Cyan
