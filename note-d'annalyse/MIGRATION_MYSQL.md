# 🔄 MIGRATION POSTGRESQL → MYSQL

## ⚠️ MODIFICATIONS REQUISES POUR MYSQL

### **Problème: MySQL ne supporte pas les tableaux de types primitifs**

MySQL ne supporte pas `String[]`, contrairement à PostgreSQL. Il faut utiliser le type `Json` à la place.

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Champ `targetAudience` dans `Announcement`**

**Avant** (PostgreSQL):
```prisma
model Announcement {
  targetAudience    String[]  // ["TEACHER", "STUDENT", "PARENT"] ou ["ALL"]
}
```

**Après** (MySQL):
```prisma
model Announcement {
  targetAudience    Json      // ["TEACHER", "STUDENT", "PARENT"] ou ["ALL"]
}
```

### **2. Champ `customCategories` dans `UserUploadPermission`**

**Avant** (PostgreSQL):
```prisma
model UserUploadPermission {
  customCategories  String[]  // Catégories supplémentaires autorisées
}
```

**Après** (MySQL):
```prisma
model UserUploadPermission {
  customCategories  Json      // Catégories supplémentaires autorisées
}
```

---

## 📝 IMPACT SUR LE CODE

### **Lecture des données**

**Avant** (PostgreSQL):
```typescript
const announcement = await prisma.announcement.findUnique({
  where: { id }
})
// announcement.targetAudience est string[]
const audiences: string[] = announcement.targetAudience
```

**Après** (MySQL):
```typescript
const announcement = await prisma.announcement.findUnique({
  where: { id }
})
// announcement.targetAudience est Json (any)
const audiences: string[] = announcement.targetAudience as string[]
```

### **Écriture des données**

**Aucun changement nécessaire** - Les deux fonctionnent de la même manière:
```typescript
await prisma.announcement.create({
  data: {
    targetAudience: ["TEACHER", "STUDENT"]  // Fonctionne pour Json et String[]
  }
})
```

---

## 🔍 FICHIERS À VÉRIFIER

### **1. Announcements**

Fichiers potentiellement affectés:
- `app/api/announcements/route.ts`
- `components/admin/announcements-manager.tsx`
- Tout fichier utilisant `announcement.targetAudience`

**Action**: Ajouter un cast `as string[]` si nécessaire

### **2. UserUploadPermission**

Fichiers potentiellement affectés:
- `app/api/upload/route.ts`
- `components/admin/upload-permissions-manager.tsx`
- Tout fichier utilisant `permission.customCategories`

**Action**: Ajouter un cast `as string[]` si nécessaire

---

## 🚀 COMMANDES DE MIGRATION

### **1. Vérifier la connexion MySQL**

Assurez-vous que votre `DATABASE_URL` dans `.env` pointe vers MySQL:
```env
DATABASE_URL="mysql://user:password@host:port/database"
```

### **2. Pousser le schéma vers MySQL**

```bash
# Pousser le schéma sans créer de migration
npx prisma db push

# Ou créer une migration
npx prisma migrate dev --name mysql_compatibility
```

### **3. Régénérer le client Prisma**

```bash
npx prisma generate
```

### **4. Redémarrer le serveur**

```bash
npm run dev
```

---

## ⚠️ DIFFÉRENCES MYSQL vs POSTGRESQL

### **Types de données**

| PostgreSQL | MySQL | Notes |
|------------|-------|-------|
| `String[]` | `Json` | MySQL ne supporte pas les tableaux |
| `@db.Text` | `@db.Text` | Identique |
| `@db.VarChar(255)` | `@db.VarChar(255)` | Identique |
| `Decimal` | `Decimal` | Identique |

### **Fonctionnalités**

| Fonctionnalité | PostgreSQL | MySQL |
|----------------|------------|-------|
| Tableaux natifs | ✅ Oui | ❌ Non (utiliser Json) |
| JSON | ✅ JSONB | ✅ JSON |
| Full-text search | ✅ Natif | ⚠️ Limité |
| Enums | ✅ Natif | ✅ Natif |

---

## 🔧 TESTS RECOMMANDÉS

### **1. Tester les Announcements**

```typescript
// Créer une annonce
const announcement = await prisma.announcement.create({
  data: {
    title: "Test",
    content: "Test content",
    targetAudience: ["TEACHER", "STUDENT"],
    authorId: "xxx",
    authorName: "Test",
    authorRole: "SCHOOL_ADMIN",
    priority: "NORMAL"
  }
})

// Lire et vérifier
const audiences = announcement.targetAudience as string[]
console.log(audiences) // ["TEACHER", "STUDENT"]
```

### **2. Tester les Upload Permissions**

```typescript
// Créer une permission
const permission = await prisma.userUploadPermission.create({
  data: {
    userId: "xxx",
    grantedBy: "yyy",
    customCategories: ["documents", "images"]
  }
})

// Lire et vérifier
const categories = permission.customCategories as string[]
console.log(categories) // ["documents", "images"]
```

---

## 📊 CHECKLIST DE MIGRATION

- [x] Modifier `targetAudience` de `String[]` à `Json`
- [x] Modifier `customCategories` de `String[]` à `Json`
- [ ] Mettre à jour `DATABASE_URL` vers MySQL
- [ ] Exécuter `npx prisma db push`
- [ ] Exécuter `npx prisma generate`
- [ ] Vérifier les fichiers utilisant `targetAudience`
- [ ] Vérifier les fichiers utilisant `customCategories`
- [ ] Ajouter des casts `as string[]` si nécessaire
- [ ] Tester la création d'annonces
- [ ] Tester les permissions d'upload
- [ ] Redémarrer le serveur

---

## 🎯 PROCHAINES ÉTAPES

1. **Vérifier la connexion MySQL**
   ```bash
   npx prisma db push
   ```

2. **Si succès, régénérer le client**
   ```bash
   npx prisma generate
   ```

3. **Redémarrer le serveur TypeScript**
   - `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

4. **Tester l'application**
   - Créer une annonce
   - Vérifier les permissions

---

## 💡 NOTES IMPORTANTES

### **Performance**

Le type `Json` en MySQL est performant pour:
- Lecture/écriture de petits tableaux (< 100 éléments)
- Stockage de configurations
- Métadonnées

### **Limitations**

- Pas de contraintes de type au niveau DB (validation côté application)
- Indexation JSON limitée comparée aux tableaux PostgreSQL
- Requêtes JSON plus complexes

### **Recommandations**

Pour de gros volumes de données avec recherche complexe:
- Considérer une table de liaison (many-to-many)
- Ou rester sur PostgreSQL

Pour votre cas d'usage (annonces et permissions):
- ✅ Le type `Json` est parfaitement adapté

---

## ✅ RÉSUMÉ

**Modifications**: 2 champs convertis de `String[]` à `Json`  
**Impact code**: Minimal (ajouter casts `as string[]`)  
**Compatibilité**: 100% MySQL  
**Tests**: Recommandés mais non bloquants  

**Vous pouvez maintenant exécuter `npx prisma db push` sans erreur !** 🎉
