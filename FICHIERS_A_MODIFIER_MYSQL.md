# 📝 FICHIERS À MODIFIER POUR MYSQL

## ⚠️ PROBLÈME: Requêtes Prisma avec `has` et `hasSome`

Les opérateurs `has` et `hasSome` fonctionnent avec `String[]` en PostgreSQL mais **NE FONCTIONNENT PAS** avec `Json` en MySQL.

Il faut modifier les requêtes pour utiliser des opérateurs JSON compatibles MySQL.

---

## 🔧 FICHIERS À MODIFIER

### **1. app/teacher/[schoolId]/announcements/page.tsx**

**Ligne 21-23** - Requête avec `has`

**Avant** (PostgreSQL):
```typescript
OR: [
  { targetAudience: { has: 'ALL' } },
  { targetAudience: { has: 'TEACHER' } }
]
```

**Après** (MySQL):
```typescript
OR: [
  { targetAudience: { path: '$', array_contains: 'ALL' } },
  { targetAudience: { path: '$', array_contains: 'TEACHER' } }
]
```

**OU Solution Alternative** (plus simple):
```typescript
// Récupérer toutes les annonces et filtrer côté application
const allAnnouncements = await prisma.announcement.findMany({
  where: {
    schoolId: schoolId,
    isActive: true
  },
  orderBy: { publishedAt: 'desc' }
})

// Filtrer côté application
const announcements = allAnnouncements.filter(a => {
  const audience = a.targetAudience as string[]
  return audience.includes('ALL') || audience.includes('TEACHER')
})
```

---

### **2. app/student/[schoolId]/page.tsx**

**Ligne 114-116** - Requête avec `hasSome`

**Avant** (PostgreSQL):
```typescript
targetAudience: {
  hasSome: ['ALL', 'STUDENT']
}
```

**Après** (MySQL - Solution recommandée):
```typescript
// Récupérer toutes les annonces
const allAnnouncements = await prisma.announcement.findMany({
  where: {
    schoolId: student.schoolId,
    isActive: true,
    OR: [
      { publishedAt: { lte: new Date() } },
      { publishedAt: null }
    ]
  },
  orderBy: { publishedAt: 'desc' },
  take: 5
})

// Filtrer côté application
const announcements = allAnnouncements.filter(a => {
  const audience = a.targetAudience as string[]
  return audience.includes('ALL') || audience.includes('STUDENT')
})
```

---

### **3. app/api/announcements/route.ts**

**Ligne 46-48** - Requête avec `has`

**Avant** (PostgreSQL):
```typescript
OR: [
  { targetAudience: { has: user.role } },
  { targetAudience: { has: 'ALL' } }
]
```

**Après** (MySQL):
```typescript
// Récupérer toutes les annonces et filtrer
const allAnnouncements = await prisma.announcement.findMany({
  where: {
    AND: [
      schoolId ? { schoolId } : {},
      { isActive: true }
    ]
  },
  include: { school: true },
  orderBy: { publishedAt: 'desc' }
})

// Filtrer côté application
const announcements = allAnnouncements.filter(a => {
  const audience = a.targetAudience as string[]
  return audience.includes(user.role) || audience.includes('ALL')
})

return NextResponse.json(announcements)
```

---

### **4. app/api/admin/announcements/route.ts**

**Ligne 62-64** - Validation `targetAudience`

**Avant**:
```typescript
const isValid = targetAudience.every((a: string) => allowedAudience.includes(a))
```

**Après** (aucun changement nécessaire - fonctionne avec Json):
```typescript
// Vérifier que targetAudience est un tableau
if (!Array.isArray(targetAudience)) {
  return NextResponse.json({ error: 'targetAudience doit être un tableau' }, { status: 400 })
}

const isValid = targetAudience.every((a: string) => allowedAudience.includes(a))
```

---

### **5. lib/upload-permissions-manager.ts**

**Ligne 80-82** - Utilisation de `customCategories`

**Avant**:
```typescript
const customCategories = customPermissions!.customCategories || []
return Array.from(new Set([...defaultCategories, ...customCategories]))
```

**Après** (avec cast):
```typescript
const customCategories = (customPermissions!.customCategories as string[]) || []
return Array.from(new Set([...defaultCategories, ...customCategories]))
```

**Ligne 171-173** - Formatage permissions

**Avant**:
```typescript
if (permissions.customCategories && permissions.customCategories.length > 0) {
  parts.push(`Catégories: ${permissions.customCategories.join(', ')}`)
}
```

**Après** (avec cast):
```typescript
const categories = permissions.customCategories as string[] | undefined
if (categories && categories.length > 0) {
  parts.push(`Catégories: ${categories.join(', ')}`)
}
```

---

### **6. app/api/admin/upload-permissions/route.ts**

**Ligne 159** - Retour customCategories

**Avant**:
```typescript
customCategories: customPermissions.customCategories || []
```

**Après** (avec cast):
```typescript
customCategories: (customPermissions.customCategories as string[]) || []
```

---

## 📊 RÉSUMÉ DES MODIFICATIONS

| Fichier | Ligne | Type | Difficulté |
|---------|-------|------|------------|
| teacher/announcements/page.tsx | 21-23 | Requête `has` | Moyenne |
| student/page.tsx | 114-116 | Requête `hasSome` | Moyenne |
| api/announcements/route.ts | 46-48 | Requête `has` | Moyenne |
| api/admin/announcements/route.ts | 62-64 | Validation | Facile |
| lib/upload-permissions-manager.ts | 80, 171 | Cast | Facile |
| api/admin/upload-permissions/route.ts | 159 | Cast | Facile |

---

## 🎯 STRATÉGIE RECOMMANDÉE

### **Option 1: Filtrage Côté Application** ✅ RECOMMANDÉ

**Avantages**:
- Simple à implémenter
- Fonctionne immédiatement
- Pas de dépendance aux opérateurs JSON MySQL

**Inconvénients**:
- Légèrement moins performant pour de gros volumes
- Récupère plus de données que nécessaire

**Quand l'utiliser**:
- Pour les annonces (généralement < 100 par école)
- Pour les permissions (généralement < 50 par utilisateur)

### **Option 2: Opérateurs JSON MySQL** ⚠️ COMPLEXE

**Avantages**:
- Filtrage au niveau DB
- Meilleure performance pour gros volumes

**Inconvénients**:
- Syntaxe complexe et spécifique MySQL
- Moins portable
- Peut varier selon version MySQL

**Quand l'utiliser**:
- Pour de très gros volumes (> 1000 enregistrements)
- Quand la performance est critique

---

## ✅ PLAN D'ACTION

### **Étape 1: Modifications Faciles** (5 min)

1. Ajouter casts dans `lib/upload-permissions-manager.ts`
2. Ajouter cast dans `api/admin/upload-permissions/route.ts`
3. Ajouter validation tableau dans `api/admin/announcements/route.ts`

### **Étape 2: Modifications Requêtes** (15 min)

1. Modifier `teacher/announcements/page.tsx`
2. Modifier `student/page.tsx`
3. Modifier `api/announcements/route.ts`

### **Étape 3: Tests** (10 min)

1. Créer une annonce
2. Vérifier affichage teacher
3. Vérifier affichage student
4. Tester permissions upload

---

## 🚀 COMMANDES

```bash
# 1. Pousser le schéma (devrait fonctionner maintenant)
npx prisma db push

# 2. Régénérer le client
npx prisma generate

# 3. Faire les modifications de code ci-dessus

# 4. Redémarrer le serveur
npm run dev

# 5. Tester
```

---

## 💡 EXEMPLE COMPLET

### **Avant (PostgreSQL)**
```typescript
const announcements = await prisma.announcement.findMany({
  where: {
    schoolId,
    targetAudience: { has: 'TEACHER' }
  }
})
```

### **Après (MySQL)**
```typescript
const allAnnouncements = await prisma.announcement.findMany({
  where: { schoolId }
})

const announcements = allAnnouncements.filter(a => {
  const audience = a.targetAudience as string[]
  return audience.includes('TEACHER')
})
```

---

## ⚠️ IMPORTANT

**Ces modifications sont NÉCESSAIRES pour que l'application fonctionne avec MySQL.**

Sans elles, vous aurez des erreurs lors de:
- Affichage des annonces
- Filtrage par audience
- Gestion des permissions

**Temps estimé total: 30 minutes**

---

**Consultez `MIGRATION_MYSQL.md` pour plus de détails sur la migration.** 📚
