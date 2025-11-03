# Envoi des Identifiants Enseignants par Email

## ✅ Fonctionnalité Implémentée

Les administrateurs peuvent maintenant envoyer les identifiants de connexion aux enseignants par email, de la même manière que pour les étudiants.

## 🎯 Fonctionnement

### 1. Accès à la Fonctionnalité

**Chemin:** Admin → Enseignants → Actions (⋮) → Voir informations

Dans le dialogue "Informations de l'enseignant", un nouveau bouton **"Envoyer identifiants"** est disponible.

### 2. Processus d'Envoi

1. **Cliquer sur "Envoyer identifiants"**
   - Un dialogue s'ouvre avec les informations à envoyer

2. **Informations affichées:**
   - ✅ Email de connexion
   - ✅ Mot de passe initial (password123)
   - ✅ Type d'enseignant (PERMANENT/VACATAIRE)
   - ✅ Grade

3. **Entrer l'email du destinataire:**
   - Email de l'enseignant
   - Ou email de l'administration

4. **Cliquer sur "Envoyer"**
   - Email envoyé via Brevo
   - Notification de succès

## 📧 Contenu de l'Email

L'email envoyé contient :

### Informations de l'Enseignant
- Nom complet avec titre
- Type (PERMANENT/VACATAIRE)
- Grade

### Identifiants de Connexion
- **Email:** L'email de l'enseignant
- **Mot de passe initial:** password123

### Instructions
1. Se rendre sur la page de connexion
2. Entrer l'email
3. Entrer le mot de passe initial
4. Changer le mot de passe dès la première connexion

### Avertissements de Sécurité
- ⚠️ Changer le mot de passe immédiatement
- ⚠️ Ne jamais partager les identifiants
- ⚠️ Utiliser un mot de passe fort

## 🔧 Fichiers Créés/Modifiés

### 1. API Route
**Fichier:** `app/api/school-admin/enseignants/[id]/send-credentials/route.ts`

```typescript
POST /api/school-admin/enseignants/[id]/send-credentials
Body: { recipientEmail: string }
```

**Fonctionnalités:**
- ✅ Vérification des permissions (SCHOOL_ADMIN/SUPER_ADMIN)
- ✅ Récupération des infos enseignant
- ✅ Vérification que l'enseignant a un compte utilisateur
- ✅ Génération du contenu HTML de l'email
- ✅ Envoi via Brevo
- ✅ Gestion des erreurs

### 2. Page Enseignants
**Fichier:** `app/admin/[schoolId]/enseignants/page.tsx`

**Ajouts:**
- ✅ Import de `Mail` icon et `sonnerToast`
- ✅ States pour le dialogue d'envoi d'email
- ✅ Bouton "Envoyer identifiants" dans le dialogue d'infos
- ✅ Dialogue d'envoi avec formulaire
- ✅ Fonction d'envoi avec gestion d'erreurs

## 🎨 Interface Utilisateur

### Bouton dans le Dialogue d'Informations
```tsx
<Button className="bg-blue-600 hover:bg-blue-700">
  <Mail className="h-4 w-4 mr-2" />
  Envoyer identifiants
</Button>
```

### Dialogue d'Envoi
- **Titre:** "Envoyer les identifiants"
- **Description:** Nom complet de l'enseignant
- **Aperçu:** Informations qui seront envoyées
- **Champ:** Email du destinataire
- **Actions:** Annuler / Envoyer

## 🔐 Sécurité

### Vérifications Côté Serveur
- ✅ Authentification requise (SCHOOL_ADMIN/SUPER_ADMIN)
- ✅ Vérification de l'accès à l'école
- ✅ Vérification que l'enseignant existe
- ✅ Vérification que l'enseignant a un compte utilisateur

### Mot de Passe Initial
- **Valeur:** `password123`
- **Recommandation:** L'enseignant DOIT le changer dès la première connexion
- **Future amélioration:** Générer un mot de passe aléatoire et l'envoyer une seule fois

## 📊 Cas d'Utilisation

### Scénario 1: Nouvel Enseignant
1. Admin crée un enseignant
2. Admin crée un compte utilisateur pour l'enseignant
3. Admin ouvre les informations de l'enseignant
4. Admin clique sur "Envoyer identifiants"
5. Admin entre l'email de l'enseignant
6. Enseignant reçoit l'email avec ses identifiants

### Scénario 2: Enseignant Existant
1. Admin ouvre les informations d'un enseignant existant
2. Admin clique sur "Envoyer identifiants"
3. Admin entre l'email (peut être différent de l'email de connexion)
4. Email envoyé avec les identifiants actuels

### Scénario 3: Enseignant sans Compte
1. Admin ouvre les informations d'un enseignant
2. Admin clique sur "Envoyer identifiants"
3. **Erreur:** "Cet enseignant n'a pas encore de compte utilisateur"
4. Admin doit d'abord créer un compte utilisateur

## ⚠️ Limitations et Prérequis

### Prérequis
1. **Brevo configuré** (BREVO_API_KEY dans .env.local)
2. **Enseignant doit avoir un compte utilisateur** (relation `user` non null)
3. **Email expéditeur vérifié** dans Brevo

### Limitations
- Le mot de passe est fixe (`password123`)
- Pas de génération de mot de passe aléatoire
- Pas de lien de réinitialisation de mot de passe

## 🚀 Améliorations Futures

### Court Terme
1. **Générer un mot de passe aléatoire** lors de la création du compte
2. **Envoyer automatiquement** l'email lors de la création d'un enseignant
3. **Ajouter un bouton** dans la liste des enseignants (pas seulement dans le dialogue)

### Moyen Terme
1. **Lien de réinitialisation** de mot de passe
2. **Token temporaire** pour la première connexion
3. **Historique des envois** d'emails
4. **Template personnalisable** pour l'email

### Long Terme
1. **Authentification à deux facteurs** (2FA)
2. **Connexion SSO** (Single Sign-On)
3. **Gestion des sessions** avancée

## 📝 Comparaison avec les Étudiants

| Fonctionnalité | Étudiants | Enseignants |
|----------------|-----------|-------------|
| Envoi d'identifiants | ✅ | ✅ |
| ID d'enrôlement | ✅ | ❌ |
| Email suggéré | ✅ | ❌ |
| Mot de passe initial | Défini lors de l'enrôlement | password123 |
| Auto-enrôlement | ✅ | ❌ |
| Création par admin | ✅ | ✅ |

## 🎯 Résultat

Les administrateurs peuvent maintenant :
- ✅ Envoyer les identifiants de connexion aux enseignants
- ✅ Utiliser le même système d'email que pour les étudiants
- ✅ Avoir un processus unifié et professionnel
- ✅ Faciliter l'onboarding des nouveaux enseignants

## 📧 Test

1. Créer un enseignant avec un compte utilisateur
2. Ouvrir ses informations
3. Cliquer sur "Envoyer identifiants"
4. Entrer votre email de test
5. Vérifier la réception de l'email
6. Confirmer que toutes les informations sont correctes

**Email reçu en ~30 secondes** avec un design professionnel et toutes les instructions ! 🎉
