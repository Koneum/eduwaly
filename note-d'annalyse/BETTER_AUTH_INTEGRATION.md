# 🔐 Intégration Better Auth - Système Amélioré

## ✅ Ce qui a été intégré depuis Sissan

### 1. **Hook usePermissions** (`lib/use-permissions.tsx`)

Système de permissions granulaires adapté pour Schooly avec support multi-écoles.

**Fonctionnalités:**
- ✅ Permissions granulaires (canView, canCreate, canEdit, canDelete)
- ✅ Compatible avec `schoolId` (multi-tenant)
- ✅ SUPER_ADMIN et SCHOOL_ADMIN ont toutes les permissions
- ✅ MANAGER, PERSONNEL, ASSISTANT, SECRETARY ont des permissions configurables

**Utilisation:**
```tsx
import { usePermissions } from '@/lib/use-permissions'

function StudentManagement() {
  const { canCreate, canEdit, canDelete, hasSchoolAccess } = usePermissions()
  
  // Vérifier l'accès à l'école
  if (!hasSchoolAccess(schoolId)) {
    return <div>Accès refusé</div>
  }
  
  return (
    <div>
      {canCreate('students') && <Button>Ajouter un étudiant</Button>}
      {canEdit('students') && <Button>Modifier</Button>}
      {canDelete('students') && <Button>Supprimer</Button>}
    </div>
  )
}
```

### 2. **Architecture Hybride**

Combinaison du meilleur des deux systèmes :

| Aspect | Solution Schooly |
|--------|------------------|
| **Protection de base** | Middleware Edge Runtime (compatible Vercel) |
| **Redirections** | Server Components (plus fiables) |
| **Permissions** | Hook client `usePermissions` (UI responsive) |
| **Multi-tenant** | `schoolId` partout |

## 📊 Catégories de Permissions pour Schooly

### Catégories Suggérées

```typescript
type PermissionCategory = 
  | 'dashboard'      // Tableau de bord
  | 'students'       // Gestion étudiants
  | 'teachers'       // Gestion enseignants
  | 'parents'        // Gestion parents
  | 'courses'        // Gestion des cours
  | 'modules'        // Gestion des modules
  | 'filieres'       // Gestion des filières
  | 'schedules'      // Emploi du temps
  | 'grades'         // Notes et évaluations
  | 'attendance'     // Présences
  | 'finance'        // Finances et paiements
  | 'staff'          // Gestion du personnel
  | 'settings'       // Paramètres de l'école
  | 'reports'        // Rapports et statistiques
```

## 🗄️ Base de Données - À Ajouter

### Modèles Prisma Nécessaires

Ajoutez ces modèles à votre `schema.prisma` :

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  category    String   // 'students', 'teachers', 'finance', etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  userPermissions UserPermission[]
  
  @@index([category])
}

model UserPermission {
  id           String   @id @default(cuid())
  userId       String
  permissionId String
  canView      Boolean  @default(true)
  canCreate    Boolean  @default(false)
  canEdit      Boolean  @default(false)
  canDelete    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([userId, permissionId])
  @@index([userId])
  @@index([permissionId])
}
```

Puis ajoutez la relation dans le modèle `User` :

```prisma
model User {
  // ... champs existants
  permissions UserPermission[]
}
```

## 🚀 Étapes d'Implémentation

### Étape 1 : Mise à Jour du Schéma Prisma

```bash
# 1. Modifier prisma/schema.prisma (ajouter Permission et UserPermission)
# 2. Créer la migration
npx prisma migrate dev --name add_permissions_system

# 3. Générer le client Prisma
npx prisma generate
```

### Étape 2 : Seed des Permissions

Créez `prisma/seed-permissions.ts` :

```typescript
import prisma from '../lib/prisma'

const permissions = [
  // Dashboard
  { name: 'Voir le tableau de bord', category: 'dashboard' },
  
  // Étudiants
  { name: 'Voir les étudiants', category: 'students' },
  { name: 'Créer des étudiants', category: 'students' },
  { name: 'Modifier les étudiants', category: 'students' },
  { name: 'Supprimer des étudiants', category: 'students' },
  
  // Enseignants
  { name: 'Voir les enseignants', category: 'teachers' },
  { name: 'Créer des enseignants', category: 'teachers' },
  { name: 'Modifier les enseignants', category: 'teachers' },
  { name: 'Supprimer des enseignants', category: 'teachers' },
  
  // Finances
  { name: 'Voir les finances', category: 'finance' },
  { name: 'Créer des transactions', category: 'finance' },
  { name: 'Modifier les transactions', category: 'finance' },
  { name: 'Supprimer des transactions', category: 'finance' },
  
  // Notes
  { name: 'Voir les notes', category: 'grades' },
  { name: 'Saisir les notes', category: 'grades' },
  { name: 'Modifier les notes', category: 'grades' },
  { name: 'Supprimer les notes', category: 'grades' },
  
  // ... Autres catégories
]

async function main() {
  console.log('🌱 Seeding permissions...')
  
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    })
  }
  
  console.log('✅ Permissions created!')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
```

Exécutez :
```bash
npx tsx prisma/seed-permissions.ts
```

### Étape 3 : API Route pour les Permissions

Créez `app/api/permissions/user/[userId]/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const user = await getAuthUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  
  // Seul l'utilisateur lui-même ou un admin peut voir ses permissions
  if (user.id !== params.userId && user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  
  const permissions = await prisma.userPermission.findMany({
    where: { userId: params.userId },
    include: {
      permission: true
    }
  })
  
  return NextResponse.json({ permissions })
}
```

### Étape 4 : Page de Gestion des Permissions

Créez `app/admin/[schoolId]/settings/staff/permissions/page.tsx` :

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface Permission {
  id: string
  name: string
  category: string
}

export default function StaffPermissionsPage({ params }: { params: { schoolId: string } }) {
  const [staff, setStaff] = useState([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  
  // Grouper les permissions par catégorie
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)
  
  return (
    <div>
      <h1>Gestion des Permissions du Personnel</h1>
      
      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <div key={category}>
          <h2>{category}</h2>
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Voir</th>
                <th>Créer</th>
                <th>Modifier</th>
                <th>Supprimer</th>
              </tr>
            </thead>
            <tbody>
              {perms.map(perm => (
                <tr key={perm.id}>
                  <td>{perm.name}</td>
                  <td><Checkbox /></td>
                  <td><Checkbox /></td>
                  <td><Checkbox /></td>
                  <td><Checkbox /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
```

## 🎯 Exemples d'Utilisation

### Exemple 1 : Protéger un Bouton

```tsx
import { usePermissions } from '@/lib/use-permissions'
import { Button } from '@/components/ui/button'

function StudentActions() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  
  return (
    <div className="flex gap-2">
      {canCreate('students') && (
        <Button onClick={handleCreate}>Ajouter un étudiant</Button>
      )}
      {canEdit('students') && (
        <Button onClick={handleEdit}>Modifier</Button>
      )}
      {canDelete('students') && (
        <Button variant="destructive" onClick={handleDelete}>
          Supprimer
        </Button>
      )}
    </div>
  )
}
```

### Exemple 2 : Masquer une Section

```tsx
import { usePermissions } from '@/lib/use-permissions'

function FinanceSection() {
  const { hasAnyPermission } = usePermissions()
  
  if (!hasAnyPermission('finance')) {
    return null // Section masquée
  }
  
  return <FinanceDashboard />
}
```

### Exemple 3 : Navigation Conditionnelle

```tsx
import { usePermissions } from '@/lib/use-permissions'

function Sidebar() {
  const { canView } = usePermissions()
  
  return (
    <nav>
      {canView('dashboard') && <NavItem href="/admin/dashboard">Dashboard</NavItem>}
      {canView('students') && <NavItem href="/admin/students">Étudiants</NavItem>}
      {canView('teachers') && <NavItem href="/admin/teachers">Enseignants</NavItem>}
      {canView('finance') && <NavItem href="/admin/finance">Finances</NavItem>}
    </nav>
  )
}
```

## 🔄 Migration depuis Sissan

### Ce qui a été conservé de Schooly

✅ **Middleware Edge Runtime** - Plus performant que la protection client
✅ **`schoolId`** - Essentiel pour le multi-tenant
✅ **Server Components** - Redirections côté serveur
✅ **Rôles hiérarchiques** - SUPER_ADMIN > SCHOOL_ADMIN > MANAGER...

### Ce qui a été ajouté de Sissan

✅ **Permissions granulaires** - Contrôle fin par catégorie
✅ **Hook `usePermissions`** - Interface réactive
✅ **Système CRUD permissions** - Gestion dynamique

### Différences clés

| Aspect | Sissan | Schooly |
|--------|--------|---------|
| Architecture | Client-side protection | Middleware + Server Components |
| Portée | Une boutique | Multi-écoles |
| Redirections | `useEffect` + `router.push` | Server `redirect()` |
| Rôles | 5 rôles | 9 rôles |

## 📝 TODO - Implémentation Complète

- [ ] Ajouter modèles Prisma (Permission, UserPermission)
- [ ] Créer migration et seed des permissions
- [ ] Créer API route `/api/permissions/user/[userId]`
- [ ] Créer page de gestion des permissions staff
- [ ] Mettre à jour les composants existants pour utiliser `usePermissions`
- [ ] Tester avec différents rôles
- [ ] Documenter les catégories de permissions

## 🎉 Avantages du Système Hybride

1. **Performance** - Middleware léger + Server Components
2. **Sécurité** - Double vérification (serveur + permissions)
3. **Flexibilité** - Permissions configurables par utilisateur
4. **Scalabilité** - Support multi-écoles natif
5. **UX** - Interface réactive avec `usePermissions`

Le système est prêt à être implémenté ! 🚀
