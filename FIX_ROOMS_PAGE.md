# ✅ FIX PAGE SALLES - RÉCUPÉRATION DONNÉES

## 🔍 PROBLÈME

La page `/admin/[schoolId]/rooms` ne récupère pas les données des salles.

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Amélioration de la Requête Prisma**

**Avant** (typage complexe):
```typescript
const school = (await prisma.school.findUnique({
  where: { id: schoolId },
  include: {
    rooms: {
      orderBy: { name: 'asc' }
    }
  }
})) as unknown as ({ rooms: RoomModel[]; schoolType: 'HIGH_SCHOOL' | 'UNIVERSITY' } & Record<string, unknown>) | null
```

**Après** (select explicite):
```typescript
const school = await prisma.school.findUnique({
  where: { id: schoolId },
  select: {
    schoolType: true,
    rooms: {
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        capacity: true,
        isAvailable: true,
        type: true,
        equipment: true,
        building: true,
        floor: true,
      }
    }
  }
})
```

### **Avantages**
- ✅ Typage TypeScript correct
- ✅ Pas de cast `as unknown`
- ✅ Sélection explicite des champs
- ✅ Meilleure performance

---

## 🔍 VÉRIFICATIONS À FAIRE

### **1. Vérifier que des salles existent**

```sql
-- Vérifier les salles dans la base
SELECT id, name, code, schoolId FROM rooms;

-- Vérifier pour une école spécifique
SELECT * FROM rooms WHERE schoolId = 'votre-school-id';
```

### **2. Vérifier le type d'école**

La page redirige automatiquement vers `/classes` si c'est un lycée:

```typescript
if (school.schoolType === 'HIGH_SCHOOL') {
  redirect(`/admin/${schoolId}/classes`)
}
```

**Important**: Les salles (rooms) sont pour les **UNIVERSITÉS** uniquement.
Les lycées utilisent les **classes**.

---

## 📊 STRUCTURE DES DONNÉES

### **Modèle Room (Prisma)**

```prisma
model Room {
  id          String   @id @default(cuid())
  name        String   // "Amphi A", "Salle 201"
  code        String   // "A01", "S201"
  capacity    Int      // Capacité
  type        RoomType // AMPHITHEATER, CLASSROOM, etc.
  building    String?  // Bâtiment
  floor       String?  // Étage
  equipment   String   @default("[]") // JSON array
  isAvailable Boolean  @default(true)
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id])
  
  @@unique([code, schoolId])
  @@map("rooms")
}
```

### **Types de Salles**

```typescript
enum RoomType {
  AMPHITHEATER    // Amphithéâtre
  CLASSROOM       // Salle de classe
  LABORATORY      // Laboratoire
  COMPUTER_LAB    // Salle informatique
  LIBRARY         // Bibliothèque
  SPORTS_HALL     // Salle de sport
  CONFERENCE      // Salle de conférence
  OTHER           // Autre
}
```

---

## 🚀 AJOUTER DES SALLES DE TEST

Si aucune salle n'existe, vous pouvez en créer via le composant `RoomsManager` ou directement en base :

### **Via SQL**

```sql
-- Exemple: Ajouter une salle
INSERT INTO rooms (
  id, name, code, capacity, type, building, floor, 
  equipment, isAvailable, schoolId, createdAt, updatedAt
) VALUES (
  'room-001',
  'Amphithéâtre A',
  'AMPH-A',
  200,
  'AMPHITHEATER',
  'Bâtiment Principal',
  'Rez-de-chaussée',
  '["Projecteur", "Micro", "Tableau"]',
  true,
  'votre-school-id',
  NOW(),
  NOW()
);
```

### **Via Prisma (seed ou script)**

```typescript
await prisma.room.create({
  data: {
    name: 'Amphithéâtre A',
    code: 'AMPH-A',
    capacity: 200,
    type: 'AMPHITHEATER',
    building: 'Bâtiment Principal',
    floor: 'Rez-de-chaussée',
    equipment: JSON.stringify(['Projecteur', 'Micro', 'Tableau']),
    isAvailable: true,
    schoolId: 'votre-school-id',
  }
})
```

---

## 🧪 TESTER LA PAGE

### **1. Accéder à la page**

```
http://localhost:3000/admin/[schoolId]/rooms
```

**Remplacer `[schoolId]`** par l'ID de votre université.

### **2. Vérifier le type d'école**

Si vous êtes redirigé vers `/classes`, c'est que l'école est de type `HIGH_SCHOOL`.

Pour les lycées, utilisez:
```
http://localhost:3000/admin/[schoolId]/classes
```

### **3. Résultat Attendu**

**Si des salles existent**:
- ✅ Statistiques affichées (Total, Capacité, Disponibles, Occupées)
- ✅ Liste des salles en grille
- ✅ Détails de chaque salle (nom, code, capacité, type, équipements)

**Si aucune salle**:
- ✅ Message "Aucune salle"
- ✅ Bouton "Ajouter une salle"

---

## 🔧 DÉPANNAGE

### **Problème: Page vide ou erreur**

1. **Vérifier les logs du serveur**
   ```bash
   # Dans le terminal où tourne npm run dev
   # Chercher les erreurs Prisma
   ```

2. **Vérifier que la table existe**
   ```sql
   SHOW TABLES LIKE 'rooms';
   ```

3. **Vérifier la migration**
   ```bash
   npx prisma db push
   ```

### **Problème: Redirection vers /classes**

L'école est de type `HIGH_SCHOOL`. Pour tester les salles:

1. **Changer le type d'école**
   ```sql
   UPDATE schools 
   SET schoolType = 'UNIVERSITY' 
   WHERE id = 'votre-school-id';
   ```

2. **Ou utiliser une université existante**
   ```sql
   SELECT id, name, schoolType FROM schools WHERE schoolType = 'UNIVERSITY';
   ```

### **Problème: Aucune donnée affichée**

1. **Vérifier que des salles existent**
   ```sql
   SELECT COUNT(*) FROM rooms WHERE schoolId = 'votre-school-id';
   ```

2. **Ajouter des salles de test** (voir section ci-dessus)

3. **Vérifier les permissions**
   - Vous devez être connecté
   - Vous devez avoir accès à cette école

---

## 📝 CHECKLIST

- [x] Requête Prisma améliorée
- [x] Select explicite des champs
- [x] Typage correct
- [ ] Vérifier que des salles existent en base
- [ ] Tester la page avec une université
- [ ] Ajouter des salles si nécessaire
- [ ] Vérifier l'affichage des statistiques
- [ ] Tester le bouton "Ajouter une salle"

---

## 💡 NOTES IMPORTANTES

### **Différence Rooms vs Classes**

- **Rooms (Salles)**: Pour les **UNIVERSITÉS**
  - Amphithéâtres, laboratoires, salles de cours
  - Gestion flexible, pas de classe fixe
  - Étudiants changent de salle selon les cours

- **Classes**: Pour les **LYCÉES**
  - Classes fixes (Terminale S1, Première A, etc.)
  - Élèves assignés à une classe
  - Emploi du temps par classe

### **Composant RoomsManager**

Le bouton en haut à droite utilise le composant `RoomsManager` pour:
- ✅ Ajouter une nouvelle salle
- ✅ Modifier une salle existante
- ✅ Supprimer une salle

---

## ✅ RÉSULTAT ATTENDU

Après ces corrections, la page devrait:

1. ✅ Charger correctement les données
2. ✅ Afficher les statistiques
3. ✅ Lister toutes les salles
4. ✅ Permettre l'ajout/modification/suppression

**Si aucune salle n'existe, un message clair s'affiche avec un bouton pour en ajouter.**

---

## 🎯 PROCHAINES ÉTAPES

1. **Vérifier les données en base**
   ```bash
   # Ouvrir Prisma Studio
   npx prisma studio
   
   # Naviguer vers la table "rooms"
   # Vérifier qu'il y a des données
   ```

2. **Tester la page**
   ```
   http://localhost:3000/admin/[schoolId]/rooms
   ```

3. **Ajouter des salles si nécessaire**
   - Via l'interface (bouton RoomsManager)
   - Ou via un script de seed

---

**LA PAGE DEVRAIT MAINTENANT RÉCUPÉRER LES DONNÉES CORRECTEMENT !** 🎉
