# Configuration Vitepay et Emails

## Variables d'environnement à ajouter dans `.env.local`

```env
# Vitepay Configuration
VITEPAY_API_KEY=votre_cle_api
VITEPAY_API_SECRET=votre_secret_api
VITEPAY_WEBHOOK_SECRET=votre_secret_webhook
VITEPAY_BASE_URL=https://api.vitepay.com/v1

# Brevo (déjà configuré)
BREVO_API_KEY=votre_cle_brevo

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuration Webhook Vitepay

1. Se connecter à votre compte Vitepay
2. Aller dans **Paramètres** → **Webhooks**
3. Ajouter un nouveau webhook:
   - **URL**: `https://votre-domaine.com/api/vitepay/webhook`
   - **Événements**: Sélectionner tous les événements de paiement
   - **Secret**: Copier le secret généré dans `VITEPAY_WEBHOOK_SECRET`

## Configuration Vercel Cron Jobs

Créer un fichier `vercel.json` à la racine:

```json
{
  "crons": [
    {
      "path": "/api/cron/payment-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Explication**: Envoie les rappels de paiement tous les jours à 9h00 UTC.

## Test des fonctionnalités

### 1. Tester la vérification de quota
```bash
# Créer un étudiant (devrait vérifier le quota)
curl -X POST http://localhost:3000/api/school-admin/students \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Student","studentNumber":"ST001","niveau":"L1","schoolId":"..."}'
```

### 2. Tester la création de paiement Vitepay
```bash
curl -X POST http://localhost:3000/api/vitepay/create-payment \
  -H "Content-Type: application/json" \
  -d '{"planId":"...","schoolId":"..."}'
```

### 3. Tester l'envoi d'emails
Les emails sont envoyés automatiquement lors:
- Inscription d'une nouvelle école
- 7 jours avant expiration d'abonnement
- 1 jour avant expiration
- Réception d'un paiement
- Expiration d'abonnement

## Documentation

- **Vitepay**: https://api.vitepay.com/developers
- **Brevo**: https://developers.brevo.com/
- **Vercel Cron**: https://vercel.com/docs/cron-jobs
