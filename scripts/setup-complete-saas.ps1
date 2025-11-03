# Script principal pour configurer toutes les fonctionnalités SAAS

Write-Host "🚀 Configuration complète du système SAAS Schooly" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 1. Système de quotas et limites
Write-Host "1️⃣ Configuration du système de quotas..." -ForegroundColor Yellow
.\scripts\setup-subscription-features.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration des quotas" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. APIs Vitepay
Write-Host "2️⃣ Création des APIs Vitepay..." -ForegroundColor Yellow
.\scripts\create-vitepay-apis.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la création des APIs Vitepay" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Templates d'emails et relances
Write-Host "3️⃣ Configuration du système d'emails..." -ForegroundColor Yellow
.\scripts\create-email-templates.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la configuration des emails" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Configuration SAAS terminée avec succès!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Récapitulatif des fichiers créés:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Système de Quotas:" -ForegroundColor Yellow
Write-Host "  ✓ lib/subscription/quota-middleware.ts" -ForegroundColor Gray
Write-Host "  ✓ lib/vitepay/config.ts" -ForegroundColor Gray
Write-Host "  ✓ lib/vitepay/client.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "APIs Vitepay:" -ForegroundColor Yellow
Write-Host "  ✓ app/api/vitepay/webhook/route.ts" -ForegroundColor Gray
Write-Host "  ✓ app/api/vitepay/create-payment/route.ts" -ForegroundColor Gray
Write-Host "  ✓ app/api/vitepay/verify-payment/[id]/route.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "Système d'Emails:" -ForegroundColor Yellow
Write-Host "  ✓ lib/email/templates.ts (6 templates)" -ForegroundColor Gray
Write-Host "  ✓ lib/email/sender.ts" -ForegroundColor Gray
Write-Host "  ✓ app/api/cron/payment-reminders/route.ts" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Prochaines étapes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ajouter les variables d'environnement dans .env.local:" -ForegroundColor White
Write-Host "   VITEPAY_API_KEY=votre_cle_api" -ForegroundColor Gray
Write-Host "   VITEPAY_API_SECRET=votre_secret_api" -ForegroundColor Gray
Write-Host "   VITEPAY_WEBHOOK_SECRET=votre_secret_webhook" -ForegroundColor Gray
Write-Host "   VITEPAY_BASE_URL=https://api.vitepay.com/v1" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Configurer le webhook Vitepay:" -ForegroundColor White
Write-Host "   URL: https://votre-domaine.com/api/vitepay/webhook" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Configurer Vercel Cron (créer vercel.json):" -ForegroundColor White
Write-Host '   {' -ForegroundColor Gray
Write-Host '     "crons": [{' -ForegroundColor Gray
Write-Host '       "path": "/api/cron/payment-reminders",' -ForegroundColor Gray
Write-Host '       "schedule": "0 9 * * *"' -ForegroundColor Gray
Write-Host '     }]' -ForegroundColor Gray
Write-Host '   }' -ForegroundColor Gray
Write-Host ""

Write-Host "4. Tester les fonctionnalités:" -ForegroundColor White
Write-Host "   • Créer un étudiant (vérifier quota)" -ForegroundColor Gray
Write-Host "   • Créer un paiement Vitepay" -ForegroundColor Gray
Write-Host "   • Vérifier réception des emails" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • Vitepay: https://api.vitepay.com/developers" -ForegroundColor Gray
Write-Host "   • Brevo: https://developers.brevo.com/" -ForegroundColor Gray
Write-Host "   • Vercel Cron: https://vercel.com/docs/cron-jobs" -ForegroundColor Gray
Write-Host ""
