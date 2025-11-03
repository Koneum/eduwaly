# Corriger les fichiers restants avec "const session ="

$files = Get-ChildItem -Path "app\api" -Filter "route.ts" -Recurse -File

$corrected = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if (!$content) { continue }
    
    if ($content -match "const session = await") {
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        Write-Host "Correction de: $relativePath" -ForegroundColor Yellow
        
        # Remplacer toutes les occurrences
        $content = $content -replace "const session = await getAuthUser\(\)", "const user = await getAuthUser()"
        $content = $content -replace "const session = await auth\(\)", "const user = await getAuthUser()"
        $content = $content -replace "const session = await getServerSession\(authOptions\)", "const user = await getAuthUser()"
        
        # Remplacer session.user par user
        $content = $content -replace "session\.user\.role", "user.role"
        $content = $content -replace "session\.user\.schoolId", "user.schoolId"
        $content = $content -replace "session\.user\.id", "user.id"
        $content = $content -replace "session\.user\.email", "user.email"
        $content = $content -replace "session\.user", "user"
        
        # Remplacer les vérifications
        $content = $content -replace "if \(!session\?\.user\)", "if (!user)"
        $content = $content -replace "if \(session\?\.user\)", "if (user)"
        
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "✓ Corrigé!" -ForegroundColor Green
        $corrected++
    }
}

Write-Host "`n$corrected fichiers corrigés!" -ForegroundColor Cyan
