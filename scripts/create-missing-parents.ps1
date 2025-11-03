# Script PowerShell pour créer les parents manquants
# Exécute le script TypeScript qui crée automatiquement des parents
# pour tous les étudiants qui n'en ont pas

Write-Host "🚀 Création des parents manquants..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Exécuter le script TypeScript avec tsx
Write-Host "📝 Exécution du script..." -ForegroundColor Yellow
npx tsx scripts/create-missing-parents.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Script exécuté avec succès!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Le script a rencontré des erreurs" -ForegroundColor Red
    exit 1
}
