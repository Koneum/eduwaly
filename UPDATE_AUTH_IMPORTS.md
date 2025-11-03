# 🔧 Guide de Mise à Jour des Imports NextAuth v5

## ✅ Corrections Effectuées

### 1. **lib/prisma.ts**
```typescript
// ❌ AVANT
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

// ✅ APRÈS
import { PrismaClient } from '@prisma/client'
```

### 2. **lib/auth.ts**
```typescript
// ✅ Ajout de types pour credentials
const email = credentials.email as string
const password = credentials.password as string

// ✅ Utilisation des variables typées
const isPasswordValid = await bcrypt.compare(password, user.password)
```

### 3. **prisma/seed.ts**
```typescript
// ❌ AVANT
import { PrismaClient } from '@prisma/client/scripts/default-index.js'

// ✅ APRÈS
import { PrismaClient } from '@prisma/client'
```

---

## 🔄 Fichiers API à Mettre à Jour (20 fichiers)

Tous les fichiers API qui utilisent `getServerSession` et `authOptions` doivent être mis à jour :

### Remplacement Global Nécessaire

**Dans tous les fichiers `app/api/**/*.ts` :**

```typescript
// ❌ ANCIEN CODE
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)

// ✅ NOUVEAU CODE
import { auth } from '@/lib/auth'

const session = await auth()
```

### Liste des Fichiers à Mettre à Jour

1. `app/api/fee-structures/route.ts` (5 occurrences)
2. `app/api/issues/route.ts` (5 occurrences)
3. `app/api/scholarships/route.ts` (5 occurrences)
4. `app/api/school-admin/users/route.ts` (5 occurrences)
5. `app/api/students/payments/route.ts` (4 occurrences)
6. `app/api/school-admin/fee-structures/[id]/route.ts` (3 occurrences)
7. `app/api/school-admin/fee-structures/route.ts` (3 occurrences)
8. `app/api/school-admin/rooms/route.ts` (3 occurrences)
9. `app/api/school-admin/scholarships/[id]/route.ts` (3 occurrences)
10. `app/api/school-admin/scholarships/route.ts` (3 occurrences)
11. `app/api/school-admin/payments/route.ts` (2 occurrences)
12. `app/api/school-admin/profile/send-verification/route.ts` (2 occurrences)
13. `app/api/school-admin/profile/update-email/route.ts` (2 occurrences)
14. `app/api/school-admin/profile/update-password/route.ts` (2 occurrences)
15. `app/api/school-admin/reminders/route.ts` (2 occurrences)
16. `app/api/school-admin/rooms/[id]/route.ts` (2 occurrences)
17. `app/api/school-admin/rooms/import/route.ts` (2 occurrences)
18. `app/api/school-admin/scholarships/[id]/remove-student/route.ts` (2 occurrences)
19. `app/api/school-admin/students/[id]/route.ts` (2 occurrences)
20. `app/api/school-admin/students/import/route.ts` (2 occurrences)

---

## 🛠️ Script de Remplacement Automatique (PowerShell)

Exécutez ce script dans le terminal PowerShell à la racine du projet :

```powershell
# Trouver tous les fichiers TypeScript dans app/api
$files = Get-ChildItem -Path "app\api" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Vérifier si le fichier contient getServerSession
    if ($content -match "getServerSession") {
        Write-Host "Mise à jour de: $($file.FullName)"
        
        # Remplacer les imports
        $content = $content -replace "import \{ getServerSession \} from 'next-auth'", ""
        $content = $content -replace "import \{ authOptions \} from '@/lib/auth'", "import { auth } from '@/lib/auth'"
        
        # Remplacer les appels
        $content = $content -replace "await getServerSession\(authOptions\)", "await auth()"
        $content = $content -replace "getServerSession\(authOptions\)", "auth()"
        
        # Nettoyer les imports vides
        $content = $content -replace "import \{ \} from 'next-auth'\r?\n", ""
        $content = $content -replace "\r?\n\r?\n\r?\n", "`r`n`r`n"
        
        # Sauvegarder
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "✅ Mise à jour terminée!"
```

---

## ✅ Vérification Manuelle Recommandée

Après avoir exécuté le script, vérifiez manuellement quelques fichiers pour vous assurer que :

1. Les imports sont corrects
2. Il n'y a pas de lignes vides en trop
3. Les appels `await auth()` fonctionnent correctement

---

## 📝 Résumé des Changements

### Imports Prisma
- ✅ `lib/prisma.ts` - Utilise `@prisma/client`
- ✅ `prisma/seed.ts` - Utilise `@prisma/client`

### Imports NextAuth
- ✅ `lib/auth.ts` - Export `auth` function
- ✅ `lib/auth-utils.ts` - Utilise `auth()`
- ✅ `app/page.tsx` - Utilise `auth()`
- ✅ `app/api/auth/[...nextauth]/route.ts` - Utilise `handlers`
- ✅ `middleware.ts` - Utilise `auth((req) => {...})`
- ⏳ `app/api/**/*.ts` - À mettre à jour (20 fichiers)

---

**Date**: 30 octobre 2025  
**Version NextAuth**: 5.0.0-beta.30  
**Version Prisma**: 6.18.0
