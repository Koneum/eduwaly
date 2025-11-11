# Script de Vérification des Champs Prisma
# Vérifie que tous les nouveaux champs sont correctement utilisés

Write-Host "🔍 VÉRIFICATION DES CHAMPS PRISMA" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "d:\react\UE-GI app\schooly"
$errors = @()
$warnings = @()

# Fonction pour vérifier un fichier
function Test-PrismaField {
    param(
        [string]$FilePath,
        [string]$FieldName,
        [string]$Context
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $FieldName) {
            Write-Host "  ✅ $Context : $FieldName trouvé" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ⚠️  $Context : $FieldName non trouvé" -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Host "  ❌ Fichier non trouvé : $FilePath" -ForegroundColor Red
        $script:errors += "Fichier manquant : $FilePath"
        return $false
    }
}

# 1. Vérifier le schéma Prisma
Write-Host "1️⃣  Vérification du schéma Prisma..." -ForegroundColor Yellow
$schemaPath = "$projectRoot\prisma\schema.prisma"

$fieldsToCheck = @{
    "enrollmentYear" = "Student.enrollmentYear"
    "courseSchedule" = "Student.courseSchedule"
    "gradingSystem" = "School.gradingSystem"
    "gradingFormula" = "School.gradingFormula"
    "model GradingPeriod" = "Modèle GradingPeriod"
    "model EvaluationType" = "Modèle EvaluationType"
    "enum CourseSchedule" = "Enum CourseSchedule"
    "enum GradingSystem" = "Enum GradingSystem"
}

foreach ($field in $fieldsToCheck.Keys) {
    Test-PrismaField -FilePath $schemaPath -FieldName $field -Context $fieldsToCheck[$field]
}

Write-Host ""

# 2. Vérifier les pages
Write-Host "2️⃣  Vérification des pages..." -ForegroundColor Yellow

$pagesToCheck = @(
    @{
        Path = "$projectRoot\app\teacher\[schoolId]\grades\page.tsx"
        Fields = @("enrollmentYear")
        Name = "Grades Enseignant"
    },
    @{
        Path = "$projectRoot\app\admin\[schoolId]\settings\grading\page.tsx"
        Fields = @("evaluationTypes", "gradingPeriods", "gradingSystem")
        Name = "Configuration Admin"
    },
    @{
        Path = "$projectRoot\app\admin\[schoolId]\bulletins\page.tsx"
        Fields = @("gradingSystem", "gradingFormula", "enrollmentYear", "gradingPeriod")
        Name = "Bulletins Admin"
    }
)

foreach ($page in $pagesToCheck) {
    Write-Host "  📄 $($page.Name)" -ForegroundColor Cyan
    foreach ($field in $page.Fields) {
        Test-PrismaField -FilePath $page.Path -FieldName $field -Context "  └─"
    }
    Write-Host ""
}

# 3. Vérifier les APIs
Write-Host "3️⃣  Vérification des APIs..." -ForegroundColor Yellow

$apisToCheck = @(
    @{
        Path = "$projectRoot\app\api\admin\grading\system\route.ts"
        Fields = @("gradingSystem", "gradingFormula")
        Name = "API Système"
    },
    @{
        Path = "$projectRoot\app\api\admin\grading\evaluation-types\route.ts"
        Fields = @("evaluationType")
        Name = "API Types Évaluations"
    },
    @{
        Path = "$projectRoot\app\api\admin\grading\periods\route.ts"
        Fields = @("gradingPeriod")
        Name = "API Périodes"
    },
    @{
        Path = "$projectRoot\app\api\admin\bulletins\generate\route.ts"
        Fields = @("evaluationTypes", "gradingPeriod", "gradingFormula")
        Name = "API Génération Bulletins"
    }
)

foreach ($api in $apisToCheck) {
    Write-Host "  🔌 $($api.Name)" -ForegroundColor Cyan
    foreach ($field in $api.Fields) {
        Test-PrismaField -FilePath $api.Path -FieldName $field -Context "  └─"
    }
    Write-Host ""
}

# 4. Vérifier les composants
Write-Host "4️⃣  Vérification des composants..." -ForegroundColor Yellow

$componentsToCheck = @(
    @{
        Path = "$projectRoot\components\teacher\students-grades-list.tsx"
        Fields = @("enrollmentYear")
        Name = "Liste Étudiants Grades"
    },
    @{
        Path = "$projectRoot\components\admin\students-schedule-tabs.tsx"
        Fields = @("courseSchedule")
        Name = "Onglets Horaires"
    },
    @{
        Path = "$projectRoot\components\admin\student-enrollment-form.tsx"
        Fields = @("enrollmentYear", "courseSchedule")
        Name = "Formulaire Inscription"
    }
)

foreach ($component in $componentsToCheck) {
    Write-Host "  🧩 $($component.Name)" -ForegroundColor Cyan
    foreach ($field in $component.Fields) {
        Test-PrismaField -FilePath $component.Path -FieldName $field -Context "  └─"
    }
    Write-Host ""
}

# 5. Vérifier la migration
Write-Host "5️⃣  Vérification de la migration..." -ForegroundColor Yellow

$migrationPath = "$projectRoot\prisma\migrations"
$migrationName = "20251109184343_add_grading_system_and_enrollment"

if (Test-Path "$migrationPath\$migrationName") {
    Write-Host "  ✅ Migration trouvée : $migrationName" -ForegroundColor Green
} else {
    Write-Host "  ❌ Migration non trouvée : $migrationName" -ForegroundColor Red
    $errors += "Migration manquante"
}

Write-Host ""

# 6. Vérifier le client Prisma
Write-Host "6️⃣  Vérification du client Prisma..." -ForegroundColor Yellow

$prismaClientPath = "$projectRoot\node_modules\.prisma\client"
if (Test-Path $prismaClientPath) {
    Write-Host "  ✅ Client Prisma trouvé" -ForegroundColor Green
    
    # Vérifier la date de génération
    $clientDate = (Get-Item $prismaClientPath).LastWriteTime
    $schemaDate = (Get-Item $schemaPath).LastWriteTime
    
    if ($clientDate -gt $schemaDate) {
        Write-Host "  ✅ Client Prisma à jour (généré après le schéma)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Client Prisma obsolète (généré avant le schéma)" -ForegroundColor Yellow
        $warnings += "Client Prisma doit être régénéré"
    }
} else {
    Write-Host "  ❌ Client Prisma non trouvé" -ForegroundColor Red
    $errors += "Client Prisma manquant"
}

Write-Host ""

# Résumé
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ TOUT EST CORRECT !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Actions recommandées :" -ForegroundColor Yellow
    Write-Host "  1. Arrêter le serveur dev (Ctrl+C)" -ForegroundColor White
    Write-Host "  2. Redémarrer : npm run dev" -ForegroundColor White
    Write-Host "  3. Rafraîchir le navigateur (F5)" -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ ERREURS TROUVÉES :" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  AVERTISSEMENTS :" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "🔧 Actions requises :" -ForegroundColor Yellow
    if ($errors -contains "Client Prisma manquant" -or $warnings -contains "Client Prisma doit être régénéré") {
        Write-Host "  1. npx prisma generate" -ForegroundColor White
    }
    if ($errors -contains "Migration manquante") {
        Write-Host "  2. npx prisma migrate dev --name add_grading_system_and_enrollment" -ForegroundColor White
    }
    Write-Host "  3. Redémarrer le serveur dev" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Documentation complète : FIX_PRISMA_ERROR.md" -ForegroundColor Cyan
Write-Host ""
