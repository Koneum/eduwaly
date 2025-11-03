# Scripts de Gestion des Comptes

Ce dossier contient des scripts utilitaires pour gérer les comptes utilisateurs avec Better Auth.

## 📋 Scripts Disponibles

### 🔍 Diagnostic

#### `check-superadmin.ts`
Vérifie l'état du compte Super Admin et diagnostique les problèmes potentiels.

```bash
npx tsx scripts/check-superadmin.ts
```

**Ce script vérifie:**
- ✅ Existence de l'utilisateur dans la table `User`
- ✅ Présence du compte dans la table `Account`
- ✅ Validité du hash du mot de passe
- ✅ Rôle et permissions
- ✅ Sessions actives

#### `check-auth-accounts.ts`
Vérifie tous les comptes utilisateurs de l'application.

```bash
npx tsx scripts/check-auth-accounts.ts
```

### 🔧 Correction

#### `fix-superadmin.ts`
Corrige le compte Super Admin en cas de problème d'authentification.

```bash
npx tsx scripts/fix-superadmin.ts
```

**Ce script:**
1. Supprime l'ancien compte (User, Account, Sessions)
2. Recrée le compte via l'API Better Auth
3. Configure le rôle SUPER_ADMIN
4. Vérifie la création du hash de mot de passe

**Informations de connexion:**
- Email: `superadmin@saas.com`
- Mot de passe: `password123`

### 🔄 Réinitialisation

#### `reset-auth-accounts.ts`
Réinitialise TOUS les comptes utilisateurs de l'application.

```bash
npx tsx scripts/reset-auth-accounts.ts
```

⚠️ **ATTENTION:** Ce script supprime tous les utilisateurs et les recrée.

**Comptes créés:**
- Super Admin: `superadmin@saas.com`
- Admin Excellence: `admin@excellence-dakar.sn`
- Professeur: `teacher@excellence-dakar.sn`
- Étudiants: `student1@excellence-dakar.sn`, `student2@excellence-dakar.sn`
- Parent: `parent@excellence-dakar.sn`
- Admin Moderne: `admin@moderne-abidjan.ci`

**Mot de passe pour tous:** `password123`

#### `create-auth-accounts.ts`
Crée des comptes Better Auth pour tous les utilisateurs existants dans la base.

```bash
npx tsx scripts/create-auth-accounts.ts
```

### 🔄 Synchronisation

#### `sync-auth-accounts.ts`
Synchronise les comptes existants avec Better Auth.

```bash
npx tsx scripts/sync-auth-accounts.ts
```

## 🐛 Résolution de Problèmes

### Erreur: "Invalid password hash"

**Symptôme:** Impossible de se connecter, erreur lors de l'authentification.

**Cause:** Le hash du mot de passe dans la table `Account` est invalide ou manquant.

**Solution:**
```bash
# 1. Vérifier le problème
npx tsx scripts/check-superadmin.ts

# 2. Corriger le compte
npx tsx scripts/fix-superadmin.ts

# 3. Tester la connexion
# Allez sur http://localhost:3000/login
# Email: superadmin@saas.com
# Mot de passe: password123
```

### Erreur: "User not found"

**Symptôme:** Le compte n'existe pas dans la base de données.

**Solution:**
```bash
# Créer tous les comptes
npx tsx scripts/reset-auth-accounts.ts
```

### Comptes désynchronisés

**Symptôme:** L'utilisateur existe dans `User` mais pas dans `Account`.

**Solution:**
```bash
# Synchroniser les comptes
npx tsx scripts/sync-auth-accounts.ts
```

## 📝 Notes Importantes

1. **Serveur de développement requis:** Les scripts qui créent des comptes via l'API nécessitent que le serveur Next.js soit en cours d'exécution (`npm run dev`).

2. **Base de données:** Assurez-vous que la base de données PostgreSQL est accessible et que les migrations Prisma sont à jour.

3. **Variables d'environnement:** Le script utilise `NEXT_PUBLIC_BASE_URL` ou `http://localhost:3000` par défaut.

4. **Mot de passe par défaut:** Tous les comptes de développement utilisent `password123` comme mot de passe.

## 🔐 Sécurité

⚠️ **Ces scripts sont pour le développement uniquement!**

- Ne jamais utiliser en production
- Les mots de passe par défaut doivent être changés
- Les scripts de réinitialisation suppriment toutes les données

## 📚 Documentation

Pour plus d'informations sur Better Auth:
- [Documentation Better Auth](https://www.better-auth.com/)
- [Prisma Adapter](https://www.better-auth.com/docs/adapters/prisma)
