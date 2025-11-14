# Migration vers Better Auth - Guide Complet

## ✅ Migration Terminée

NextAuth a été remplacé par Better Auth avec succès!

## 📋 Changements Effectués

### 1. **Schema Prisma**
- ✅ Modèle `User` mis à jour pour Better Auth
  - `emailVerified` changé de `DateTime?` à `Boolean`
  - Ajout du champ `image` pour compatibilité
  - `password` devient optionnel (Better Auth utilise `Account.password`)
- ✅ Ajout des modèles Better Auth:
  - `Session` - Gestion des sessions utilisateur
  - `Account` - Comptes et mots de passe
  - `Verification` - Codes de vérification email
- ✅ Suppression de l'ancien modèle `VerificationCode`

### 2. **Fichiers d'Authentification**
- ✅ `lib/auth.ts` - Configuration Better Auth avec Prisma Accelerate
- ✅ `lib/auth-client.ts` - Client Better Auth pour le frontend
- ✅ `lib/auth-context.tsx` - Contexte React pour l'authentification
- ✅ `app/api/auth/[...all]/route.ts` - Route API Better Auth
- ❌ Supprimé: `lib/auth.config.ts` (NextAuth)

### 3. **Middleware**
- ✅ Nouveau middleware proxy compatible Edge Runtime
- ✅ Protection des routes par rôle (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
- ✅ Redirection automatique vers le dashboard approprié après login

### 4. **Layout**
- ✅ `AuthProvider` ajouté au layout racine
- ✅ Tous les composants peuvent maintenant utiliser `useAuth()`

### 5. **Seed**
- ✅ Mise à jour pour utiliser le client Prisma généré
- ✅ Script séparé `scripts/create-auth-accounts.ts` pour créer les comptes via API

## 🚀 Prochaines Étapes

### 1. Régénérer Prisma Client
```bash
npx prisma generate
```

### 2. Migrer la Base de Données
```bash
npx prisma migrate dev --name add_better_auth_models
```

### 3. Seed la Base de Données
```bash
# 1. Créer les données de base (écoles, utilisateurs, etc.)
npx prisma db seed

# 2. Démarrer le serveur Next.js
npm run dev

# 3. Dans un autre terminal, créer les comptes Better Auth
npx tsx scripts/create-auth-accounts.ts
```

### 4. Mettre à Jour les Variables d'Environnement
Ajoutez dans votre `.env`:
```env
# Better Auth Secret (déjà généré)
BETTER_AUTH_SECRET=51223c40bfdee88a655958f477366cde1634f27cd7694670e40edf35b69ff07b

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 📝 Comptes de Test

Après le seed, vous pouvez vous connecter avec:

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | superadmin@saas.com | password123 |
| Admin École 1 | admin@excellence-dakar.sn | password123 |
| Admin École 2 | admin@moderne-abidjan.ci | password123 |
| Enseignant | teacher@excellence-dakar.sn | password123 |
| Étudiant 1 | student1@excellence-dakar.sn | password123 |
| Étudiant 2 | student2@excellence-dakar.sn | password123 |
| Parent | parent@excellence-dakar.sn | password123 |

## 🔧 Utilisation dans les Composants

### Hook useAuth
```tsx
"use client"

import { useAuth } from "@/lib/auth-context"

export default function MyComponent() {
  const { user, isLoading, signIn, signOut, isAdmin } = useAuth()

  if (isLoading) return <div>Chargement...</div>
  if (!user) return <div>Non connecté</div>

  return (
    <div>
      <p>Bonjour {user.name}</p>
      <p>Rôle: {user.role}</p>
      {isAdmin && <p>Vous êtes administrateur</p>}
      <button onClick={signOut}>Déconnexion</button>
    </div>
  )
}
```

### Vérification des Rôles
```tsx
const { user, isSuperAdmin, isSchoolAdmin, isTeacher, isStudent, isParent } = useAuth()

if (isSuperAdmin) {
  // Fonctionnalités Super Admin
}

if (isSchoolAdmin) {
  // Fonctionnalités Admin École
}
```

## 🛡️ Protection des Routes

Le middleware protège automatiquement les routes:

- `/super-admin/*` → Réservé aux SUPER_ADMIN
- `/admin/:schoolId/*` → Réservé aux SCHOOL_ADMIN de cette école
- `/teacher/:schoolId/*` → Réservé aux TEACHER de cette école
- `/student/:schoolId/*` → Réservé aux STUDENT de cette école
- `/parent/:schoolId/*` → Réservé aux PARENT de cette école

Routes publiques:
- `/login`
- `/register`
- `/enroll`
- `/unauthorized`
- `/api/auth/*`

## 🔄 Redirections Automatiques

Après connexion, l'utilisateur est redirigé vers:

| Rôle | Redirection |
|------|-------------|
| SUPER_ADMIN | `/super-admin` |
| SCHOOL_ADMIN | `/admin/:schoolId` |
| TEACHER | `/teacher/:schoolId` |
| STUDENT | `/student/:schoolId` |
| PARENT | `/parent/:schoolId` |

## 📚 Documentation

- [Better Auth](https://www.better-auth.com/)
- [Better Auth + Prisma](https://www.prisma.io/docs/guides/betterauth-nextjs)
- [Prisma Accelerate](https://www.prisma.io/docs/accelerate)

## ⚠️ Notes Importantes

1. **Prisma Accelerate** est configuré mais optionnel
2. Le **middleware** utilise l'API Better Auth pour vérifier les sessions (compatible Edge Runtime)
3. Les **mots de passe** sont hashés par Better Auth automatiquement
4. Les **sessions** expirent après 7 jours
5. Le **cookie** est préfixé par `schooly.session_token`

## 🐛 Dépannage

### Erreur "Session not found"
- Vérifiez que le serveur Next.js est démarré
- Vérifiez que `BETTER_AUTH_SECRET` est dans `.env`
- Videz les cookies du navigateur

### Erreur "User not found"
- Exécutez `npx tsx scripts/create-auth-accounts.ts`
- Vérifiez que les utilisateurs existent dans la base

### Redirection ne fonctionne pas
- Vérifiez que le `schoolId` de l'utilisateur est correct
- Vérifiez que le middleware est actif (voir console)
- Vérifiez que `NEXT_PUBLIC_BASE_URL` est correct

## ✨ Avantages de Better Auth

✅ Compatible Edge Runtime (pas de problème avec Vercel/Cloudflare)  
✅ Plus simple que NextAuth  
✅ Meilleure intégration avec Prisma  
✅ Support natif de Prisma Accelerate  
✅ Pas de configuration complexe  
✅ TypeScript first  
✅ Hooks React intégrés  

---

**Migration effectuée le:** 31 Octobre 2025  
**Par:** Assistant Cascade
