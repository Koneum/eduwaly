# 🚀 GUIDE DE MIGRATION RESPONSIVE - EXEMPLES PRATIQUES

## ✅ Ce qui a été fait

### APIs & Fonctionnalités Finalisées

✅ **Upload fichiers + Images de profil**
- `app/api/upload/route.ts` - Upload S3 avec permissions
- `app/api/user/profile-image/route.ts` - CRUD image profil
- `components/profile-image-upload.tsx` - Composant réutilisable

✅ **Système de quotas**
- `lib/quotas.ts` - Vérification limites par plan
- Fonctions: `checkQuota()`, `hasFeature()`, `requireQuota()`

✅ **Notifications Email Brevo**
- `lib/brevo.ts` - Client email complet
- 10+ templates: welcome, payment-reminder, report, absence, grade, etc.

✅ **Relances paiements automatiques**
- `app/api/cron/payment-reminders/route.ts` - Finalisé avec Brevo
- `vercel.json` - Cron configuré (9h tous les jours)

✅ **Envoi rapports par email**
- `app/api/reports/send-report/route.ts` - Finalisé avec Brevo

---

## 📱 MIGRATION RESPONSIVE

### Composants Créés

✅ `hooks/use-media-query.ts`
✅ `lib/responsive.ts` 
✅ `components/ui/drawer.tsx`
✅ `components/ui/responsive-dialog.tsx`
✅ `components/ui/responsive-table.tsx`
✅ `components/mobile-nav.tsx`
✅ `components/profile-image-upload.tsx`

### Migration Prioritaire (20 tableaux)

#### Template de Conversion

**AVANT** (Table classique):
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>
          <Button onClick={() => edit(item)}>Modifier</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**APRÈS** (ResponsiveTable):
```tsx
import { ResponsiveTable } from "@/components/ui/responsive-table"

<ResponsiveTable
  data={items}
  columns={[
    { 
      header: "Nom", 
      accessor: "name",
      priority: "high",  // Visible sur mobile
      mobileLabel: "Nom"
    },
    { 
      header: "Email", 
      accessor: "email",
      priority: "high",  // Visible sur mobile
    },
  ]}
  keyExtractor={(item) => item.id}
  actions={(item) => (
    <Button size="sm" onClick={() => edit(item)}>
      <Edit className="h-4 w-4" />
    </Button>
  )}
  emptyMessage="Aucun élément"
/>
```

---

## 📋 LISTE DES FICHIERS À MIGRER

### 🔴 PRIORITÉ 1 - School Admin (8 fichiers)

```
1. components/school-admin/users-manager.tsx
2. components/school-admin/students-manager.tsx
3. components/school-admin/finance-manager.tsx
4. components/school-admin/fee-structures-manager.tsx
5. components/school-admin/staff-manager.tsx
6. components/school-admin/rooms-manager.tsx
7. components/school-admin/scholarships-manager.tsx
8. (subscription-manager.tsx utilise déjà des Cards - OK)
```

### 🟡 PRIORITÉ 2 - Super Admin & Teacher (6 fichiers)

```
9.  components/super-admin/schools-manager.tsx
10. components/super-admin/subscriptions-manager.tsx
11. components/super-admin/issues-manager.tsx
12. components/teacher/attendance-manager.tsx
13. components/teacher/homework-manager.tsx
14. components/teacher/grades-manager.tsx
```

### 🟢 PRIORITÉ 3 - Pages Student/Parent (6 fichiers)

```
15. app/student/[schoolId]/grades/page.tsx
16. app/student/[schoolId]/absences/page.tsx
17. app/student/[schoolId]/homework/page.tsx
18. app/student/[schoolId]/payments/page.tsx
19. app/parent/[schoolId]/tracking/page.tsx
20. app/parent/[schoolId]/payments/page.tsx
```

---

## 🛠️ PROCESSUS DE MIGRATION

### Étape 1: Import ResponsiveTable

```tsx
// Ajouter cet import en haut du fichier
import { ResponsiveTable } from "@/components/ui/responsive-table"

// Retirer ou commenter:
// import { Table, TableBody, TableCell, ... } from "@/components/ui/table"
```

### Étape 2: Définir les Colonnes

```tsx
// Créer un tableau de colonnes
const columns = [
  {
    header: "Nom",
    accessor: "name",  // Ou accessor: (user) => user.name
    priority: "high",   // "high" | "medium" | "low"
    mobileLabel: "Nom", // Label sur mobile
  },
  {
    header: "Email",
    accessor: "email",
    priority: "high",
  },
  {
    header: "Rôle",
    accessor: (user) => <Badge>{user.role}</Badge>,  // JSX supporté
    priority: "medium",
  },
  {
    header: "Statut",
    accessor: (user) => (
      user.isActive ? 
        <Badge className="bg-success">Actif</Badge> : 
        <Badge variant="secondary">Inactif</Badge>
    ),
    priority: "low",  // Masqué sur mobile
  },
]
```

### Étape 3: Remplacer la Table

```tsx
<ResponsiveTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  onRowClick={(user) => console.log('Clicked:', user)}  // Optionnel
  actions={(user) => (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )}
  emptyMessage="Aucun utilisateur trouvé"
  className="mt-4"
/>
```

### Étape 4: Supprimer l'ancien code Table

```tsx
// Supprimer tout ce bloc:
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

---

## 💡 ASTUCES & PATTERNS

### Pattern 1: Badges Conditionnels

```tsx
{
  header: "Statut",
  accessor: (item) => {
    switch(item.status) {
      case 'ACTIVE': return <Badge className="bg-success">Actif</Badge>
      case 'PENDING': return <Badge variant="warning">En attente</Badge>
      case 'INACTIVE': return <Badge variant="secondary">Inactif</Badge>
      default: return <Badge>Inconnu</Badge>
    }
  },
  priority: "medium",
}
```

### Pattern 2: Dates Formatées

```tsx
{
  header: "Dernière connexion",
  accessor: (user) => 
    user.lastLoginAt 
      ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR')
      : 'Jamais',
  priority: "low",
}
```

### Pattern 3: Relations

```tsx
{
  header: "École",
  accessor: (student) => student.school?.name || 'N/A',
  priority: "high",
}
```

### Pattern 4: Calculs

```tsx
{
  header: "Total",
  accessor: (payment) => 
    `${payment.amount.toLocaleString('fr-FR')} FCFA`,
  priority: "high",
}
```

### Pattern 5: Actions Multiples

```tsx
actions: (item) => (
  <div className="flex flex-col sm:flex-row gap-2">
    <Button size="sm" variant="outline">
      <Eye className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Voir</span>
    </Button>
    <Button size="sm">
      <Edit className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Modifier</span>
    </Button>
    <Button size="sm" variant="destructive">
      <Trash2 className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Supprimer</span>
    </Button>
  </div>
)
```

---

## ✅ CHECKLIST PAR FICHIER

Pour chaque fichier migré:

- [ ] Ajouter import ResponsiveTable
- [ ] Définir colonnes avec priorities
- [ ] Remplacer <Table> par <ResponsiveTable>
- [ ] Tester sur desktop (table normale)
- [ ] Tester sur mobile (cards)
- [ ] Vérifier actions fonctionnelles
- [ ] Vérifier tri si applicable
- [ ] Commit: `feat(responsive): migrate [NomComposant] to ResponsiveTable`

---

## 🎨 OPTIMISATIONS GRAPHIQUES

### Ajouter ResponsiveContainer aux Charts

**AVANT**:
```tsx
<LineChart width={600} height={300} data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Line type="monotone" dataKey="value" />
</LineChart>
```

**APRÈS**:
```tsx
import { ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Line type="monotone" dataKey="value" />
  </LineChart>
</ResponsiveContainer>
```

**Fichiers concernés** (10+ graphiques):
- `components/revenue-chart.tsx`
- `components/payment-status-chart.tsx`
- Tous les charts dans `app/super-admin/analytics`
- Tous les charts des dashboards

---

## 🔧 VARIABLES D'ENVIRONNEMENT

Ajouter dans `.env.local`:

```env
# Brevo (Email)
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=noreply@schooly.app
BREVO_FROM_NAME=Schooly

# AWS S3 (Upload fichiers)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=schooly-files

# VitePay (Paiements)
VITEPAY_API_KEY=...
VITEPAY_API_SECRET=...
VITEPAY_MODE=sandbox

# App
NEXT_PUBLIC_APP_URL=https://eduwaly.vercel.app
```

---

## 📊 PROGRESSION

### ✅ Terminé (APIs & Infra)
- [x] Upload fichiers S3
- [x] Images de profil
- [x] Système quotas
- [x] Emails Brevo
- [x] Relances paiements
- [x] Envoi rapports
- [x] Cron jobs Vercel

### 🔄 En Cours (Responsive)
- [x] Composants responsive créés
- [x] Documentation complète
- [ ] Migration 20 tableaux (0/20)
- [ ] Migration 15 dialogues (0/15)
- [ ] Optimisation 10 graphiques (0/10)

### ⏳ À Faire
- [ ] Tests responsive complets
- [ ] Documentation finale
- [ ] Déploiement production

---

## 🚀 COMMENCER LA MIGRATION

### Option 1: Migration Manuelle (Recommandé)

```bash
# 1. Commencer par le plus simple
# Fichier: components/school-admin/users-manager.tsx

# 2. Suivre le template dans ce guide

# 3. Tester sur mobile

# 4. Passer au suivant
```

### Option 2: Utiliser le Template

Copier-coller ce template dans chaque fichier et adapter:

```tsx
import { ResponsiveTable } from "@/components/ui/responsive-table"

// Dans le composant:
const columns = [
  { header: "Col1", accessor: "field1", priority: "high" },
  { header: "Col2", accessor: "field2", priority: "high" },
  { header: "Col3", accessor: "field3", priority: "medium" },
]

return (
  <ResponsiveTable
    data={items}
    columns={columns}
    keyExtractor={(item) => item.id}
    actions={(item) => <Actions item={item} />}
  />
)
```

---

## 💪 ESTIMATION TEMPS

- 20 tableaux × 15 min = **5 heures**
- 15 dialogues × 10 min = **2.5 heures**
- 10 graphiques × 5 min = **50 minutes**
- Tests = **2 heures**

**TOTAL: ~10 heures** (1-2 jours de travail)

---

**🎯 Prêt à commencer la migration !** 

Tous les outils et templates sont prêts.
Commencez par `users-manager.tsx` comme exemple.
