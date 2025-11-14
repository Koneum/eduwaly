# Correction Erreur Brevo - IP Non Autorisée

## 🔴 Erreur Rencontrée

```
Erreur Brevo: {
  message: 'We have detected you are using an unrecognised IP address 41.73.104.126. 
  If you performed this action make sure to add the new IP address in this link: 
  https://app.brevo.com/security/authorised_ips',
  code: 'unauthorized'
}
```

## 🎯 Cause

Brevo (anciennement Sendinblue) a détecté une requête API depuis une adresse IP non autorisée: **41.73.104.126**

Pour des raisons de sécurité, Brevo exige que vous autorisiez explicitement les adresses IP qui peuvent utiliser votre clé API.

## ✅ Solution

### Étape 1: Accéder aux Paramètres de Sécurité Brevo

1. Connectez-vous à votre compte Brevo: https://app.brevo.com
2. Allez dans **Settings** (Paramètres) → **Security** (Sécurité)
3. Ou utilisez directement ce lien: https://app.brevo.com/security/authorised_ips

### Étape 2: Ajouter l'Adresse IP

1. Dans la section **Authorized IPs** (IPs Autorisées)
2. Cliquez sur **Add IP Address** (Ajouter une adresse IP)
3. Entrez l'adresse IP: **41.73.104.126**
4. Ajoutez une description: "Serveur Production Schooly" (ou similaire)
5. Cliquez sur **Save** (Enregistrer)

### Étape 3: Vérifier la Configuration

Après avoir ajouté l'IP, testez l'envoi d'email depuis votre application.

## 🌐 Gestion des IPs pour Différents Environnements

### Développement Local
Si vous développez en local, vous devrez aussi autoriser votre IP locale:
- Trouvez votre IP publique: https://whatismyipaddress.com/
- Ajoutez-la dans Brevo

### Production
- IP du serveur de production: **41.73.104.126** ✅
- Ajoutez cette IP dans Brevo

### Serveur de Staging (si applicable)
- Trouvez l'IP de votre serveur de staging
- Ajoutez-la également

## 🔐 Bonnes Pratiques

### 1. Utiliser des Plages d'IPs
Si votre hébergeur utilise plusieurs IPs, vous pouvez autoriser une plage:
```
Exemple: 41.73.104.0/24 (autorise toutes les IPs de 41.73.104.0 à 41.73.104.255)
```

### 2. Documentation
Documentez chaque IP autorisée avec:
- Description claire (ex: "Serveur Prod", "Dev Local - Jean")
- Date d'ajout
- Raison de l'autorisation

### 3. Révision Régulière
- Révisez la liste des IPs autorisées tous les 3-6 mois
- Supprimez les IPs qui ne sont plus utilisées
- Mettez à jour si votre infrastructure change

## 🚨 Sécurité

### Ne PAS Faire:
- ❌ Autoriser 0.0.0.0/0 (toutes les IPs) - très dangereux!
- ❌ Partager votre clé API publiquement
- ❌ Committer la clé API dans Git

### À Faire:
- ✅ N'autoriser que les IPs nécessaires
- ✅ Utiliser des variables d'environnement pour la clé API
- ✅ Monitorer les tentatives d'accès non autorisées
- ✅ Régénérer la clé API si elle est compromise

## 📝 Variables d'Environnement

Assurez-vous que votre fichier `.env` contient:

```env
BREVO_API_KEY=your_api_key_here
BREVO_SENDER_EMAIL=noreply@yourschool.com
BREVO_SENDER_NAME=Your School Name
```

## 🔄 Après la Configuration

Une fois l'IP autorisée, les emails devraient être envoyés sans erreur:

```typescript
// Test dans votre API
POST /api/school-admin/students/[id]/send-enrollment
{
  "recipientEmail": "test@example.com"
}

// Réponse attendue:
{
  "success": true,
  "message": "Email envoyé avec succès"
}
```

## 📞 Support

Si le problème persiste après avoir ajouté l'IP:

1. **Vérifier la clé API**: Assurez-vous qu'elle est valide et active
2. **Vérifier les quotas**: Brevo a des limites d'envoi selon votre plan
3. **Contacter Brevo**: https://help.brevo.com/

## 🎯 Checklist de Vérification

- [ ] IP ajoutée dans Brevo: 41.73.104.126
- [ ] Description ajoutée pour l'IP
- [ ] Clé API configurée dans .env
- [ ] Test d'envoi d'email réussi
- [ ] Documentation mise à jour

---
**Date**: 3 Novembre 2025  
**IP à Autoriser**: 41.73.104.126  
**Lien Direct**: https://app.brevo.com/security/authorised_ips
