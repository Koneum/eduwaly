#!/usr/bin/env pwsh
# Script pour corriger les comptes d'enrôlement sans Better Auth Account

Write-Host "🔧 Correction des comptes d'enrôlement..." -ForegroundColor Cyan
Write-Host ""

# Exécuter le script TypeScript
npx tsx scripts/fix-enrollment-accounts.ts

Write-Host ""
Write-Host "✅ Script terminé!" -ForegroundColor Green
