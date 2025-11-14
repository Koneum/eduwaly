# État d'implémentation du système de permissions

## ✅ Composants créés

### 1. **PermissionButton** (`components/permission-button.tsx`)
Bouton qui se masque automatiquement si l'utilisateur n'a pas la permission requise.

**Utilisation:**
```tsx
<PermissionButton category="students" action="create" onClick={handleCreate}>
  <Plus className="w-4 h-4 mr-2" />
  Ajouter un étudiant
</PermissionButton>
```

### 2. **PermissionMenuItem** (`components/permission-menu-item.tsx`)
Élément de menu dropdown qui se masque selon les permissions.

**Utilisation:**
```tsx
<PermissionMenuItem category="students" action="edit" onClick={handleEdit}>
  Modifier
</PermissionMenuItem>
```

### 3. **PermissionNavItem** (`components/permission-nav-item.tsx`)
Lien de navigation qui se masque selon les permissions.

**Utilisation:**
```tsx
<PermissionNavItem category="students" href="/admin/students">
  <Users className="w-5 h-5" />
  Étudiants
</PermissionNavItem>
```

## ✅ Pages implémentées

### 1. **Students Manager** (`components/school-admin/students-manager.tsx`)
- ✅ Bouton "Ajouter" → `students.create`
- ✅ Bouton "Importer Excel/CSV" → `students.create`
- ✅ Menu "Voir profil" → `students.view`
- ✅ Menu "Enregistrer paiement" → `finance.create`
- ✅ Menu "Appliquer bourse" → `finance.create`
- ✅ Menu "Envoyer rappel" → `students.edit`
- ✅ Menu "Modifier" → `students.edit`

## 📋 Pages à implémenter

### Pages prioritaires

#### 1. **Enseignants** (`app/admin/[schoolId]/enseignants/page.tsx`)
- [ ] Bouton "Ajouter un enseignant" → `teachers.create`
- [ ] Bouton "Modifier" → `teachers.edit`
- [ ] Bouton "Supprimer" → `teachers.delete`

#### 2. **Modules** (`app/admin/[schoolId]/modules/page.tsx`)
- [ ] Bouton "Ajouter un module" → `modules.create`
- [ ] Bouton "Modifier" → `modules.edit`
- [ ] Bouton "Supprimer" → `modules.delete`

#### 3. **Filières** (`app/admin/[schoolId]/filieres/page.tsx`)
- [ ] Bouton "Ajouter" → `filieres.create`
- [ ] Bouton "Modifier" → `filieres.edit`
- [ ] Bouton "Supprimer" → `filieres.delete`

#### 4. **Emploi du temps** (`app/admin/[schoolId]/emploi/page.tsx`)
- [ ] Bouton "Créer" → `schedule.create`
- [ ] Bouton "Modifier" → `schedule.edit`
- [ ] Bouton "Supprimer" → `schedule.delete`

#### 5. **Finance** (`app/admin/[schoolId]/financial-overview/page.tsx`)
- [ ] Boutons d'actions financières → `finance.*`

#### 6. **Settings/Users** (`app/admin/[schoolId]/settings/users/page.tsx`)
- [ ] Bouton "Ajouter un Membre" → `staff.create`
- [ ] Bouton "Modifier" → `staff.edit`
- [ ] Bouton "Supprimer" → `staff.delete`

### Navigation

#### **AdminSchoolNav** (`components/admin-school-nav.tsx`)
Remplacer les liens par `PermissionNavItem`:
- [ ] Étudiants → `students`
- [ ] Enseignants → `teachers`
- [ ] Modules → `modules`
- [ ] Filières → `filieres`
- [ ] Emploi du temps → `schedule`
- [ ] Finance → `finance`
- [ ] Absences → `absences`
- [ ] Notes → `grades`
- [ ] Personnel → `staff`
- [ ] Paramètres → `settings`

## 🎯 Mapping des permissions

| Page/Action | Catégorie | Action | Description |
|-------------|-----------|--------|-------------|
| **Étudiants** |
| Voir liste | `students` | `view` | Voir la liste des étudiants |
| Ajouter | `students` | `create` | Créer un nouvel étudiant |
| Modifier | `students` | `edit` | Modifier un étudiant |
| Supprimer | `students` | `delete` | Supprimer un étudiant |
| **Enseignants** |
| Voir liste | `teachers` | `view` | Voir la liste des enseignants |
| Ajouter | `teachers` | `create` | Créer un enseignant |
| Modifier | `teachers` | `edit` | Modifier un enseignant |
| Supprimer | `teachers` | `delete` | Supprimer un enseignant |
| **Modules** |
| Voir liste | `modules` | `view` | Voir les modules |
| Ajouter | `modules` | `create` | Créer un module |
| Modifier | `modules` | `edit` | Modifier un module |
| Supprimer | `modules` | `delete` | Supprimer un module |
| **Filières** |
| Voir liste | `filieres` | `view` | Voir les filières |
| Ajouter | `filieres` | `create` | Créer une filière |
| Modifier | `filieres` | `edit` | Modifier une filière |
| Supprimer | `filieres` | `delete` | Supprimer une filière |
| **Emploi du temps** |
| Voir | `schedule` | `view` | Voir les emplois du temps |
| Créer | `schedule` | `create` | Créer un emploi du temps |
| Modifier | `schedule` | `edit` | Modifier un emploi du temps |
| Supprimer | `schedule` | `delete` | Supprimer un emploi du temps |
| **Finance** |
| Voir | `finance` | `view` | Voir les finances |
| Paiement | `finance` | `create` | Enregistrer un paiement |
| Modifier | `finance` | `edit` | Modifier une transaction |
| Supprimer | `finance` | `delete` | Supprimer une transaction |
| **Absences** |
| Voir | `absences` | `view` | Voir les absences |
| Marquer | `absences` | `create` | Marquer une absence |
| Modifier | `absences` | `edit` | Modifier une absence |
| Supprimer | `absences` | `delete` | Supprimer une absence |
| **Notes** |
| Voir | `grades` | `view` | Voir les notes |
| Ajouter | `grades` | `create` | Ajouter une note |
| Modifier | `grades` | `edit` | Modifier une note |
| Supprimer | `grades` | `delete` | Supprimer une note |
| **Personnel** |
| Voir | `staff` | `view` | Voir le personnel |
| Ajouter | `staff` | `create` | Ajouter un membre |
| Modifier | `staff` | `edit` | Modifier un membre |
| Supprimer | `staff` | `delete` | Supprimer un membre |
| **Paramètres** |
| Voir | `settings` | `view` | Voir les paramètres |
| Modifier | `settings` | `edit` | Modifier les paramètres |

## 📝 Template pour implémenter les permissions

### Dans un composant client

```tsx
import { PermissionButton } from "@/components/permission-button"
import { PermissionMenuItem } from "@/components/permission-menu-item"

// Bouton d'action
<PermissionButton 
  category="students" 
  action="create"
  onClick={handleCreate}
>
  Créer
</PermissionButton>

// Menu item
<PermissionMenuItem 
  category="students" 
  action="edit"
  onClick={handleEdit}
>
  Modifier
</PermissionMenuItem>
```

### Dans la navigation

```tsx
import { PermissionNavItem } from "@/components/permission-nav-item"

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
```

## 🔄 Prochaines étapes

1. ✅ Créer les tables Prisma
2. ✅ Créer les APIs REST
3. ✅ Créer les composants de permissions
4. ✅ Implémenter dans Students Manager
5. ⏳ Implémenter dans les autres pages
6. ⏳ Mettre à jour la navigation
7. ⏳ Tester le système complet
8. ⏳ Seed les permissions par défaut

## 🧪 Test du système

### Créer un utilisateur staff

1. Aller sur `/admin/settings/users`
2. Cliquer sur "Ajouter un Membre"
3. Remplir les informations
4. Sélectionner les permissions dans l'onglet "Permissions"
5. Créer l'utilisateur

### Tester les permissions

1. Se connecter avec l'utilisateur staff
2. Vérifier que seuls les boutons/liens autorisés sont visibles
3. Essayer d'accéder à une page non autorisée → Devrait être redirigé
4. Essayer d'effectuer une action non autorisée → Devrait être bloqué

## 📊 Statistiques

- **Composants créés**: 3
- **APIs créées**: 3
- **Pages implémentées**: 1/10
- **Navigation implémentée**: 0/1
- **Permissions définies**: 66
- **Catégories**: 11
