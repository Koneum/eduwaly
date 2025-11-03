# Script pour corriger tous les imports d'authentification

$files = @(
    "app\api\admin\permissions\route.ts",
    "app\api\admin\staff\[id]\route.ts",
    "app\api\admin\staff\route.ts",
    "app\api\enseignants\route.ts",
    "app\api\issues\route.ts",
    "app\api\scholarships\route.ts",
    "app\api\school-admin\fee-structures\route.ts",
    "app\api\school-admin\payments\route.ts",
    "app\api\school-admin\profile\send-verification\route.ts",
    "app\api\school-admin\profile\update-email\route.ts",
    "app\api\school-admin\profile\update-password\route.ts",
    "app\api\school-admin\reminders\route.ts",
    "app\api\school-admin\rooms\[id]\route.ts",
    "app\api\school-admin\rooms\import\route.ts",
    "app\api\school-admin\scholarships\[id]\remove-student\route.ts",
    "app\api\school-admin\scholarships\[id]\route.ts",
    "app\api\school-admin\scholarships\route.ts",
    "app\api\school-admin\students\[id]\route.ts",
    "app\api\school-admin\students\import\route.ts",
    "app\api\school-admin\users\route.ts",
    "app\api\students\payments\route.ts"
)

$count = 0

foreach ($file in $files) {
    $fullPath = "d:\react\UE-GI app\schooly\$file"
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Remplacer les imports
        $content = $content -replace "import \{ auth \} from '@/lib/auth'", "import { getAuthUser } from '@/lib/auth-utils'"
        $content = $content -replace "import \{ getServerSession \} from 'next-auth'", ""
        $content = $content -replace "import \{ authOptions \} from '@/lib/auth'", "import { getAuthUser } from '@/lib/auth-utils'"
        
        # Remplacer les appels
        $content = $content -replace "const session = await auth\(\)", "const user = await getAuthUser()"
        $content = $content -replace "const session = await getServerSession\(authOptions\)", "const user = await getAuthUser()"
        
        # Remplacer les vérifications
        $content = $content -replace "if \(!session\?\.user\)", "if (!user)"
        $content = $content -replace "session\.user\.role", "user.role"
        $content = $content -replace "session\.user\.schoolId", "user.schoolId"
        $content = $content -replace "session\.user\.id", "user.id"
        $content = $content -replace "session\.user", "user"
        
        # Sauvegarder
        Set-Content $fullPath -Value $content -NoNewline
        $count++
        Write-Host "✓ Corrigé: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Non trouvé: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n$count fichiers corrigés avec succès!" -ForegroundColor Cyan
