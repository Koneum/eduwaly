# Guide d'utilisation du système de permissions

## 1. Utiliser PermissionButton dans les pages

### Exemple: Page des étudiants

```tsx
import { PermissionButton } from "@/components/permission-button"

export default function StudentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Étudiants</h1>
        
        {/* Bouton visible uniquement si l'utilisateur a la permission students.create */}
        <PermissionButton 
          category="students" 
          action="create"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un étudiant
        </PermissionButton>
      </div>

      {/* Liste des étudiants */}
      {students.map(student => (
        <div key={student.id}>
          <span>{student.name}</span>
          
          {/* Bouton Edit - visible si permission students.edit */}
          <PermissionButton 
            category="students" 
            action="edit"
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(student)}
          >
            <Edit className="w-4 h-4" />
          </PermissionButton>
          
          {/* Bouton Delete - visible si permission students.delete */}
          <PermissionButton 
            category="students" 
            action="delete"
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(student.id)}
          >
            <Trash className="w-4 h-4" />
          </PermissionButton>
        </div>
      ))}
    </div>
  )
}
```

## 2. Masquer les liens de navigation

### Exemple: Mise à jour de admin-school-nav.tsx

```tsx
import { PermissionNavItem } from "@/components/permission-nav-item"

export function AdminSchoolNav() {
  const pathname = usePathname()
  
  return (
    <nav>
      {/* Toujours visible */}
      <Link href="/admin/dashboard">Dashboard</Link>
      
      {/* Visible uniquement si permission students.* */}
      <PermissionNavItem
        category="students"
        href="/admin/students"
        isActive={pathname.includes('/students')}
        className="nav-link"
        activeClassName="active"
      >
        <Users className="w-5 h-5" />
        Étudiants
      </PermissionNavItem>
      
      {/* Visible uniquement si permission teachers.* */}
      <PermissionNavItem
        category="teachers"
        href="/admin/teachers"
        isActive={pathname.includes('/teachers')}
        className="nav-link"
        activeClassName="active"
      >
        <GraduationCap className="w-5 h-5" />
        Enseignants
      </PermissionNavItem>
      
      {/* Visible uniquement si permission finance.* */}
      <PermissionNavItem
        category="finance"
        href="/admin/finance"
        isActive={pathname.includes('/finance')}
        className="nav-link"
        activeClassName="active"
      >
        <DollarSign className="w-5 h-5" />
        Finance
      </PermissionNavItem>
      
      {/* Visible uniquement si permission schedule.* */}
      <PermissionNavItem
        category="schedule"
        href="/admin/schedule"
        isActive={pathname.includes('/schedule')}
        className="nav-link"
        activeClassName="active"
      >
        <Calendar className="w-5 h-5" />
        Emploi du temps
      </PermissionNavItem>
    </nav>
  )
}
```

## 3. Catégories de permissions disponibles

| Catégorie | Description | Actions |
|-----------|-------------|---------|
| `students` | Gestion des étudiants | view, create, edit, delete |
| `teachers` | Gestion des enseignants | view, create, edit, delete |
| `modules` | Gestion des modules | view, create, edit, delete |
| `filieres` | Gestion des filières | view, create, edit, delete |
| `schedule` | Emplois du temps | view, create, edit, delete |
| `finance` | Gestion financière | view, create, edit, delete |
| `absences` | Gestion des absences | view, create, edit, delete |
| `grades` | Gestion des notes | view, create, edit, delete |
| `staff` | Gestion du personnel | view, create, edit, delete |
| `settings` | Paramètres | view, edit |

## 4. Vérifier les permissions côté serveur

### Dans une API route

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // SCHOOL_ADMIN a toutes les permissions
  if (session.user.role === 'SCHOOL_ADMIN' || session.user.role === 'SUPER_ADMIN') {
    // Autoriser l'action
  } else {
    // Vérifier les permissions pour les autres rôles
    const hasPermission = await prisma.userPermission.findFirst({
      where: {
        userId: session.user.id,
        permission: {
          name: 'students.create'
        },
        canCreate: true
      }
    })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }
  }

  // Continuer avec l'action...
}
```

## 5. Créer un utilisateur staff avec permissions

### Via l'interface /admin/settings/users

1. Cliquer sur "Ajouter un Membre"
2. Remplir les informations (nom, email, mot de passe, rôle)
3. Onglet "Permissions" : Cocher les permissions souhaitées
4. Cliquer sur "Créer l'Utilisateur"

### Via l'API

```typescript
const response = await fetch('/api/admin/staff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jean Dupont',
    email: 'jean@example.com',
    password: 'password123',
    role: 'PERSONNEL',
    permissions: [
      {
        permissionId: 'perm_students_view',
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false
      },
      {
        permissionId: 'perm_absences_view',
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false
      }
    ]
  })
})
```

## 6. Rôles et hiérarchie

| Rôle | Accès | Permissions |
|------|-------|-------------|
| `SUPER_ADMIN` | Toutes les écoles | Toutes les permissions |
| `SCHOOL_ADMIN` | Son école | Toutes les permissions |
| `MANAGER` | Son école | Selon permissions attribuées |
| `PERSONNEL` | Son école | Selon permissions attribuées |
| `ASSISTANT` | Son école | Selon permissions attribuées |
| `SECRETARY` | Son école | Selon permissions attribuées |
| `TEACHER` | Son école | Accès enseignant standard |
| `STUDENT` | Son école | Accès étudiant standard |
| `PARENT` | Son école | Accès parent standard |

## 7. Bonnes pratiques

1. **Principe du moindre privilège** : N'accordez que les permissions nécessaires
2. **Vérification côté serveur** : Toujours vérifier les permissions dans les API routes
3. **UI cohérente** : Masquer les boutons ET les liens de navigation
4. **Feedback utilisateur** : Afficher un message si l'action est refusée
5. **Audit** : Logger les actions sensibles avec userId et timestamp

## 8. Migration des pages existantes

Pour chaque page admin, remplacer :

```tsx
// Avant
<Button onClick={handleCreate}>Créer</Button>

// Après
<PermissionButton category="students" action="create" onClick={handleCreate}>
  Créer
</PermissionButton>
```

Pour la navigation :

```tsx
// Avant
<Link href="/admin/students">Étudiants</Link>

// Après
<PermissionNavItem category="students" href="/admin/students">
  Étudiants
</PermissionNavItem>
```
