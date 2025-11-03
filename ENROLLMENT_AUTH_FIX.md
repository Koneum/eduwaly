# Fix: Problème d'Authentification après Enrôlement

## 🐛 Problème Identifié

Les utilisateurs qui s'enrôlaient via `/enroll` ne pouvaient pas se connecter après la création de leur compte.

### Symptômes
```
ERROR [Better Auth]: Credential account not found { email: 'king@test.com' }
POST /api/auth/sign-in/email 401
```

## 🔍 Cause Racine

L'API `/api/enroll/create` créait un enregistrement `User` avec un mot de passe hashé, mais **ne créait pas l'enregistrement `Account` requis par Better Auth**.

Better Auth utilise la table `Account` pour stocker les credentials (champ `password`), pas la table `User`.

### Architecture Better Auth
```
User (table users)
  ├── id, email, name, role, etc.
  └── accounts[] (relation)
        └── Account (table account)
              ├── accountId (email)
              ├── providerId ('credential')
              └── password (hashed)
```

## ✅ Solution Appliquée

### 1. API `/api/enroll/create` (Étudiants & Parents)

**Avant:**
```typescript
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword, // ❌ Ignoré par Better Auth
    name,
    role: 'STUDENT',
    // ...
  }
})
```

**Après:**
```typescript
const user = await prisma.user.create({
  data: {
    email,
    name,
    role: 'STUDENT',
    emailVerified: true,
    accounts: {
      create: {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        accountId: email,
        providerId: 'credential',
        password: hashedPassword // ✅ Utilisé par Better Auth
      }
    }
  }
})
```

### 2. API `/api/school-admin/users` (Création Admin)

Même correction appliquée pour les utilisateurs créés par les admins.

### 3. Mise à jour du flag `isEnrolled`

Ajout de `isEnrolled: true` lors de la création pour marquer correctement l'état d'enrôlement.

## 🔧 Script de Correction

Pour les comptes déjà créés sans Better Auth Account:

```powershell
# Exécuter depuis la racine du projet
.\scripts\fix-enrollment-accounts.ps1
```

Ce script:
1. ✅ Trouve tous les utilisateurs sans compte Better Auth
2. ✅ Remet les étudiants/parents en état non-enrôlé
3. ✅ Supprime les utilisateurs invalides
4. ✅ Permet la ré-inscription avec le même `enrollmentId`

## 📋 Procédure de Test

### Pour l'utilisateur `king@test.com`:

1. **Nettoyer le compte existant:**
   ```powershell
   .\scripts\fix-enrollment-accounts.ps1
   ```

2. **Se ré-enrôler:**
   - Aller sur `/enroll`
   - Entrer l'enrollment ID
   - Choisir "Je suis Étudiant"
   - Remplir le formulaire avec `king@test.com`
   - Créer le compte

3. **Se connecter:**
   - Aller sur `/login`
   - Email: `king@test.com`
   - Mot de passe: celui choisi lors de l'enrôlement
   - ✅ La connexion devrait fonctionner

## 📊 Fichiers Modifiés

- ✅ `app/api/enroll/create/route.ts` - Création compte Better Auth (étudiants & parents)
- ✅ `app/api/school-admin/users/route.ts` - Création compte Better Auth (admin)
- ✅ `scripts/fix-enrollment-accounts.ts` - Script de correction
- ✅ `scripts/fix-enrollment-accounts.ps1` - Wrapper PowerShell

## 🎯 Résultat Attendu

Après ces corrections:
- ✅ Les nouveaux enrôlements créent correctement le compte Better Auth
- ✅ Les utilisateurs peuvent se connecter immédiatement après l'enrôlement
- ✅ Les comptes existants peuvent être corrigés et ré-enrôlés
- ✅ Le flag `isEnrolled` est correctement mis à jour

## 🔐 Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Email vérifié automatiquement (`emailVerified: true`)
- ✅ Comptes Better Auth avec `providerId: 'credential'`
- ✅ IDs uniques pour chaque compte Account

## 📝 Notes

- Le champ `User.password` est optionnel et n'est plus utilisé
- Better Auth utilise exclusivement `Account.password`
- L'`enrollmentId` est partagé entre l'étudiant et son parent
- Un seul email peut être utilisé pour créer un compte (étudiant OU parent)
