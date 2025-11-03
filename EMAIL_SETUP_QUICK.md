# Configuration Rapide - Envoi d'Emails avec Brevo

## 🚀 Configuration en 3 Étapes

### Étape 1: Obtenir la Clé API Brevo

1. **Créer un compte Brevo (gratuit):**
   - Aller sur https://app.brevo.com/account/register
   - S'inscrire avec votre email
   - Confirmer votre email

2. **Générer une clé API:**
   - Se connecter à https://app.brevo.com
   - Aller dans **Settings** (⚙️) → **SMTP & API**
   - Cliquer sur **Create a new API key**
   - Nom: `Schooly Development`
   - **Copier la clé** (elle ne sera affichée qu'une fois !)

### Étape 2: Configurer l'Email Expéditeur

1. **Vérifier votre email expéditeur:**
   - Dans Brevo, aller dans **Senders & IP**
   - Cliquer sur **Add a sender**
   - Entrer votre email (ex: `noreply@votre-domaine.com`)
   - Vérifier l'email reçu

2. **Pour les tests (sans domaine):**
   - Vous pouvez utiliser votre email personnel
   - Ex: `votre-email@gmail.com`

### Étape 3: Ajouter les Variables d'Environnement

Créer/modifier le fichier `.env.local` à la racine du projet :

```env
# Brevo API Configuration
BREVO_API_KEY=xkeysib-votre_cle_api_ici
BREVO_SENDER_EMAIL=noreply@votre-domaine.com
BREVO_SENDER_NAME=Schooly

# URL de l'application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important:** Remplacez les valeurs par vos vraies données !

## ✅ Tester l'Envoi

1. **Redémarrer le serveur:**
   ```powershell
   # Arrêter le serveur (Ctrl+C)
   npm run dev
   ```

2. **Envoyer un email de test:**
   - Aller dans **Admin** → **Étudiants**
   - Cliquer sur **Actions** (⋮) d'un étudiant
   - Cliquer sur **Envoyer identifiants** (✉️)
   - Entrer votre email de test
   - Cliquer sur **Envoyer**

3. **Vérifier:**
   - ✅ Console: `✅ Email envoyé avec succès! Message ID: xxx`
   - ✅ Boîte de réception: Email reçu dans les 30 secondes
   - ❌ Si erreur: Vérifier la configuration ci-dessous

## 🔍 Vérification de la Configuration

### Vérifier que les variables sont chargées:

Ajouter temporairement dans l'API pour debug :
```typescript
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Définie' : '❌ Manquante')
console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL)
```

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Configuration email manquante` | `BREVO_API_KEY` non définie | Vérifier `.env.local` et redémarrer |
| `Invalid API key` | Clé API incorrecte | Régénérer une nouvelle clé dans Brevo |
| `Sender not verified` | Email expéditeur non vérifié | Vérifier l'email dans Brevo → Senders |
| `Daily quota exceeded` | Limite gratuite dépassée (300/jour) | Attendre 24h ou upgrader le plan |

## 📊 Limites du Plan Gratuit Brevo

- ✅ **300 emails/jour**
- ✅ Contacts illimités
- ✅ Templates illimités
- ✅ API complète
- ✅ Statistiques basiques

Pour plus: https://www.brevo.com/pricing/

## 🎨 Personnaliser les Emails

Les templates sont dans:
```
app/api/school-admin/students/[id]/send-enrollment/route.ts
```

Vous pouvez modifier:
- Les couleurs
- Le contenu
- La structure HTML
- Les informations affichées

## 📈 Monitoring

Voir les statistiques d'envoi dans Brevo:
1. Aller sur https://app.brevo.com
2. **Statistics** → **Email**
3. Voir:
   - Emails envoyés
   - Taux de délivrabilité
   - Taux d'ouverture
   - Bounces

## 🔐 Sécurité

**⚠️ IMPORTANT:**
- Ne jamais commiter `.env.local` dans Git
- Ajouter `.env.local` dans `.gitignore` (déjà fait)
- Utiliser des clés API différentes pour dev/prod
- Révoquer les clés compromises immédiatement

## 🆘 Support

Si problème:
1. Vérifier la console du serveur Next.js
2. Vérifier les logs dans Brevo → Logs
3. Tester l'API Brevo directement: https://developers.brevo.com/reference/sendtransacemail

## 📝 Exemple de Configuration Complète

```env
# .env.local (à la racine du projet)

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/schooly"

# Better Auth
BETTER_AUTH_SECRET="votre-secret-32-caracteres-minimum"
BETTER_AUTH_URL="http://localhost:3000"

# Brevo Email
BREVO_API_KEY="xkeysib-abc123def456..."
BREVO_SENDER_EMAIL="noreply@schooly.com"
BREVO_SENDER_NAME="Schooly"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## ✨ Prochaines Étapes

Une fois l'envoi d'emails fonctionnel:
1. ✅ Tester l'enrôlement complet
2. ✅ Envoyer des emails aux parents
3. ✅ Configurer les notifications
4. ✅ Ajouter d'autres templates (rappels, bulletins, etc.)
