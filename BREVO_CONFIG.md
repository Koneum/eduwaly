# Configuration Brevo (SendinBlue) pour l'envoi d'emails

## Variables d'environnement à ajouter dans `.env.local`:

```env
# Brevo API Configuration
BREVO_API_KEY=votre_cle_api_brevo
BREVO_SENDER_EMAIL=noreply@votre-domaine.com
BREVO_SENDER_NAME=Schooly

# URL de l'application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

## Obtenir votre clé API Brevo:

1. Connectez-vous à votre compte Brevo: https://app.brevo.com
2. Allez dans **Settings** → **SMTP & API**
3. Cliquez sur **Create a new API key**
4. Donnez un nom à votre clé (ex: "Schooly Production")
5. Copiez la clé générée

## Configuration de l'email expéditeur:

1. Dans Brevo, allez dans **Senders & IP**
2. Ajoutez votre domaine et vérifiez-le
3. Configurez les enregistrements DNS (SPF, DKIM)
4. Utilisez l'email vérifié dans `BREVO_SENDER_EMAIL`

## Test de l'envoi:

Une fois configuré, testez l'envoi depuis l'interface admin:
1. Allez dans **Étudiants**
2. Cliquez sur **Actions** → **Envoyer identifiants**
3. Vérifiez que l'email est bien reçu

## Limites Brevo (plan gratuit):

- 300 emails/jour
- Pas de limite de contacts
- Tous les templates disponibles

## Monitoring:

Consultez les statistiques d'envoi dans Brevo:
- **Statistics** → **Email**
- Taux de délivrabilité
- Taux d'ouverture
- Bounces et plaintes
