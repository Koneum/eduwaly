# ============================================================
# Script de Migration vers Architecture Feature-Based
# Schooly SAAS - 9 décembre 2025
# ============================================================

Write-Host "🏗️ Migration vers Architecture Feature-Based" -ForegroundColor Cyan
Write-Host "=" * 60

# Définir le chemin de base
$basePath = Split-Path -Parent $PSScriptRoot

# ============================================================
# ÉTAPE 1 : Créer la structure des dossiers
# ============================================================

Write-Host "`n📁 Création de la structure src/..." -ForegroundColor Yellow

$featureFolders = @(
    "src/features/admin/components",
    "src/features/admin/hooks",
    "src/features/admin/services",
    "src/features/school-admin/components",
    "src/features/school-admin/hooks",
    "src/features/school-admin/services",
    "src/features/teacher/components",
    "src/features/teacher/hooks",
    "src/features/teacher/services",
    "src/features/student/components",
    "src/features/student/hooks",
    "src/features/parent/components",
    "src/features/parent/hooks",
    "src/features/super-admin/components",
    "src/features/super-admin/services",
    "src/features/schedule/components",
    "src/features/schedule/hooks",
    "src/features/communication/components",
    "src/features/communication/services",
    "src/features/finance/components",
    "src/features/finance/services",
    "src/features/homework/components",
    "src/features/homework/hooks",
    "src/features/polls/components",
    "src/features/reports/components",
    "src/features/reports/services",
    "src/shared/components/ui",
    "src/shared/components/layout",
    "src/shared/components/forms",
    "src/shared/components/data-display",
    "src/shared/hooks",
    "src/shared/lib",
    "src/shared/types",
    "src/config"
)

foreach ($folder in $featureFolders) {
    $fullPath = Join-Path $basePath $folder
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  ✅ Créé: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️ Existe déjà: $folder" -ForegroundColor Gray
    }
}

# ============================================================
# ÉTAPE 2 : Copier les composants UI partagés
# ============================================================

Write-Host "`n📦 Copie des composants UI partagés..." -ForegroundColor Yellow

$uiSource = Join-Path $basePath "components/ui"
$uiDest = Join-Path $basePath "src/shared/components/ui"

if (Test-Path $uiSource) {
    Copy-Item -Path "$uiSource/*" -Destination $uiDest -Recurse -Force
    Write-Host "  ✅ Composants UI copiés vers src/shared/components/ui/" -ForegroundColor Green
}

# ============================================================
# ÉTAPE 3 : Copier les composants par feature
# ============================================================

Write-Host "`n📦 Copie des composants par feature..." -ForegroundColor Yellow

# Mapping source -> destination
$featureMappings = @{
    "components/admin" = "src/features/admin/components"
    "components/school-admin" = "src/features/school-admin/components"
    "components/teacher" = "src/features/teacher/components"
    "components/student" = "src/features/student/components"
    "components/super-admin" = "src/features/super-admin/components"
    "components/schedule" = "src/features/schedule/components"
    "components/messages" = "src/features/communication/components/messages"
    "components/announcements" = "src/features/communication/components/announcements"
    "components/correspondence" = "src/features/communication/components/correspondence"
    "components/appointments" = "src/features/communication/components/appointments"
    "components/homework" = "src/features/homework/components"
    "components/reports" = "src/features/reports/components"
    "components/notifications" = "src/features/communication/components/notifications"
}

foreach ($source in $featureMappings.Keys) {
    $sourcePath = Join-Path $basePath $source
    $destPath = Join-Path $basePath $featureMappings[$source]
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path "$sourcePath/*" -Destination $destPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ $source -> $($featureMappings[$source])" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Non trouvé: $source" -ForegroundColor Yellow
    }
}

# ============================================================
# ÉTAPE 4 : Copier les composants layout partagés
# ============================================================

Write-Host "`n📦 Copie des composants layout..." -ForegroundColor Yellow

$layoutComponents = @(
    "nav-accordion.tsx",
    "mobile-nav.tsx",
    "admin-school-nav.tsx",
    "student-nav.tsx",
    "teacher-nav.tsx",
    "parent-nav.tsx",
    "super-admin-nav.tsx",
    "theme-toggle.tsx",
    "theme-provider.tsx"
)

$layoutDest = Join-Path $basePath "src/shared/components/layout"

foreach ($component in $layoutComponents) {
    $sourcePath = Join-Path $basePath "components/$component"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $layoutDest -Force
        Write-Host "  ✅ $component -> layout/" -ForegroundColor Green
    }
}

# ============================================================
# ÉTAPE 5 : Copier les composants réutilisables
# ============================================================

Write-Host "`n📦 Copie des composants réutilisables..." -ForegroundColor Yellow

$sharedComponents = @(
    "stat-card.tsx",
    "feature-gate.tsx",
    "permission-button.tsx",
    "permission-nav-item.tsx",
    "permission-menu-item.tsx",
    "plan-upgrade-banner.tsx",
    "profile-image-upload.tsx",
    "students-table.tsx"
)

$sharedDest = Join-Path $basePath "src/shared/components"

foreach ($component in $sharedComponents) {
    $sourcePath = Join-Path $basePath "components/$component"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $sharedDest -Force
        Write-Host "  ✅ $component -> shared/components/" -ForegroundColor Green
    }
}

# Charts
$chartsDest = Join-Path $basePath "src/shared/components/data-display"
$chartFiles = @("payment-status-chart.tsx", "payment-status-chart-v2.tsx", "revenue-chart.tsx", "revenue-chart-v2.tsx", "recent-activity.tsx")

foreach ($chart in $chartFiles) {
    $sourcePath = Join-Path $basePath "components/$chart"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $chartsDest -Force
        Write-Host "  ✅ $chart -> data-display/" -ForegroundColor Green
    }
}

# Responsive
$responsiveSource = Join-Path $basePath "components/responsive"
if (Test-Path $responsiveSource) {
    Copy-Item -Path "$responsiveSource/*" -Destination $chartsDest -Recurse -Force
    Write-Host "  ✅ responsive/* -> data-display/" -ForegroundColor Green
}

# ============================================================
# ÉTAPE 6 : Copier les libs vers shared
# ============================================================

Write-Host "`n📦 Copie des utilitaires lib..." -ForegroundColor Yellow

$libFiles = @(
    "prisma.ts",
    "auth.ts",
    "auth-client.ts",
    "auth-utils.ts",
    "utils.ts",
    "constants.ts",
    "cors.ts",
    "cache.ts",
    "responsive.ts",
    "school-labels.ts"
)

$libDest = Join-Path $basePath "src/shared/lib"

foreach ($file in $libFiles) {
    $sourcePath = Join-Path $basePath "lib/$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $libDest -Force
        Write-Host "  ✅ lib/$file -> shared/lib/" -ForegroundColor Green
    }
}

# ============================================================
# ÉTAPE 7 : Copier les hooks
# ============================================================

Write-Host "`n📦 Copie des hooks..." -ForegroundColor Yellow

$hooksSource = Join-Path $basePath "hooks"
$hooksDest = Join-Path $basePath "src/shared/hooks"

if (Test-Path $hooksSource) {
    Copy-Item -Path "$hooksSource/*" -Destination $hooksDest -Recurse -Force
    Write-Host "  ✅ hooks/* -> shared/hooks/" -ForegroundColor Green
}

# Permission hooks spécifiques
$permHooks = @("use-permissions.ts", "use-permissions.tsx")
foreach ($hook in $permHooks) {
    $sourcePath = Join-Path $basePath "lib/$hook"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $hooksDest -Force
        Write-Host "  ✅ lib/$hook -> shared/hooks/" -ForegroundColor Green
    }
}

# ============================================================
# ÉTAPE 8 : Copier les types
# ============================================================

Write-Host "`n📦 Copie des types..." -ForegroundColor Yellow

$typesSource = Join-Path $basePath "types"
$typesDest = Join-Path $basePath "src/shared/types"

if (Test-Path $typesSource) {
    Copy-Item -Path "$typesSource/*" -Destination $typesDest -Recurse -Force
    Write-Host "  ✅ types/* -> shared/types/" -ForegroundColor Green
}

# ============================================================
# ÉTAPE 9 : Copier les services spécifiques
# ============================================================

Write-Host "`n📦 Copie des services par feature..." -ForegroundColor Yellow

# PDF services -> reports
$pdfFiles = @("pdf-generator.ts", "pdf-utils.ts")
$reportsDest = Join-Path $basePath "src/features/reports/services"

foreach ($file in $pdfFiles) {
    $sourcePath = Join-Path $basePath "lib/$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $reportsDest -Force
        Write-Host "  ✅ lib/$file -> reports/services/" -ForegroundColor Green
    }
}

# Email services -> communication
$emailFiles = @("brevo.ts", "brevo-email.ts", "email-utils.ts")
$commDest = Join-Path $basePath "src/features/communication/services"

foreach ($file in $emailFiles) {
    $sourcePath = Join-Path $basePath "lib/$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $commDest -Force
        Write-Host "  ✅ lib/$file -> communication/services/" -ForegroundColor Green
    }
}

# Finance services
$financeFiles = @("plan-limits.ts", "check-plan-limit.ts", "quotas.ts")
$financeDest = Join-Path $basePath "src/features/finance/services"

foreach ($file in $financeFiles) {
    $sourcePath = Join-Path $basePath "lib/$file"
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $financeDest -Force
        Write-Host "  ✅ lib/$file -> finance/services/" -ForegroundColor Green
    }
}

# ============================================================
# ÉTAPE 10 : Créer fichier de config
# ============================================================

Write-Host "`n📝 Création du fichier de configuration..." -ForegroundColor Yellow

$configPath = Join-Path $basePath "src/config/paths.ts"
$configContent = @"
/**
 * Chemins des features - Architecture Feature-Based
 * Généré automatiquement le $(Get-Date -Format "dd/MM/yyyy HH:mm")
 */

export const FEATURE_PATHS = {
  admin: '@/src/features/admin',
  schoolAdmin: '@/src/features/school-admin',
  teacher: '@/src/features/teacher',
  student: '@/src/features/student',
  parent: '@/src/features/parent',
  superAdmin: '@/src/features/super-admin',
  schedule: '@/src/features/schedule',
  communication: '@/src/features/communication',
  finance: '@/src/features/finance',
  homework: '@/src/features/homework',
  polls: '@/src/features/polls',
  reports: '@/src/features/reports',
} as const;

export const SHARED_PATHS = {
  components: '@/src/shared/components',
  ui: '@/src/shared/components/ui',
  hooks: '@/src/shared/hooks',
  lib: '@/src/shared/lib',
  types: '@/src/shared/types',
} as const;
"@

Set-Content -Path $configPath -Value $configContent -Encoding UTF8
Write-Host "  ✅ Créé: src/config/paths.ts" -ForegroundColor Green

# ============================================================
# RÉSUMÉ
# ============================================================

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "✅ MIGRATION TERMINÉE !" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n📋 Prochaines étapes manuelles:" -ForegroundColor Yellow
Write-Host "  1. Mettre à jour tsconfig.json avec les nouveaux alias"
Write-Host "  2. Tester l'application: npm run dev"
Write-Host "  3. Mettre à jour les imports progressivement"
Write-Host "  4. Supprimer les anciens dossiers (après validation)"

Write-Host "`n⚠️ IMPORTANT:" -ForegroundColor Red
Write-Host "  Les fichiers ont été COPIÉS, pas déplacés."
Write-Host "  Les anciens fichiers sont toujours en place."
Write-Host "  Mettez à jour les imports avant de supprimer les originaux."

Write-Host "`n"
