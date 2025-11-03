# 🎯 Implémentation des Groupes de Travail et Adaptation Lycée/Université

## ✅ Ce qui a été Implémenté

### 1. **Modèles Prisma**

#### WorkGroup
```prisma
model WorkGroup {
  id          String
  name        String
  schoolId    String
  moduleId    String?     // Pour université
  filiereId   String?     // Pour université
  createdBy   String      // userId
  creatorRole String      // STUDENT, TEACHER
  members     WorkGroupMember[]
  homework    Homework[]
}
```

#### WorkGroupMember
```prisma
model WorkGroupMember {
  id          String
  groupId     String
  studentId   String
  role        String      // LEADER, MEMBER
}
```

#### Homework (Mis à jour)
```prisma
model Homework {
  // ... champs existants
  assignmentType    String        // INDIVIDUAL, GROUP
  workGroupId       String?       // Si assigné à un groupe
  workGroup         WorkGroup?
  fileUrl           String?
  fileName          String?
  fileSize          Int?
  fileType          String?
}
```

---

### 2. **API Groupes de Travail**

**Fichier**: `app/api/work-groups/route.ts`

**Endpoints**:
- `GET /api/work-groups?moduleId=xxx&filiereId=xxx`
  - Récupérer les groupes de travail
  - Filtrage par module/filière
  
- `POST /api/work-groups`
  - Créer un groupe de travail
  - Peut être créé par enseignant ou étudiant
  - Ajout automatique des membres

---

### 3. **HomeworkManager V2**

**Fichier**: `components/teacher/homework-manager-v2.tsx`

**Nouvelles Fonctionnalités**:

#### Onglets
- ✅ **Devoirs Créés** (envoyés)
- ✅ **Devoirs Reçus** (des groupes de travail)

#### Création de Devoir
- ✅ Choix Filière/Classe
- ✅ Choix Module/Matière
- ✅ Type: Individuel ou Groupe
- ✅ Sélection multiple de groupes
- ✅ Upload de fichiers
- ✅ Création automatique d'un devoir par groupe sélectionné

#### Gestion des Groupes
- ✅ Bouton "Nouveau Groupe"
- ✅ Création de groupes par l'enseignant
- ✅ Association module/filière

#### Adaptation Lycée/Université
- ✅ Props `schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'`
- ✅ Labels adaptés:
  - Université: "Filière" / "Module"
  - Lycée: "Classe" / "Matière"

---

## 📋 Ce qui Reste à Faire

### 1. **AttendanceManager Adapté**

**Fichier à créer**: `components/teacher/attendance-manager-v2.tsx`

**Modifications nécessaires**:
```typescript
interface AttendanceManagerV2Props {
  modules: Module[]
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

// Si UNIVERSITY:
// - Sélection: Filière → Module → Date

// Si HIGH_SCHOOL:
// - Sélection: Classe → Matière → Date
```

**Labels à adapter**:
- Université: "Filière", "Module"
- Lycée: "Classe", "Matière"

---

### 2. **Mise à Jour des Pages**

#### homework-management/page.tsx
```typescript
// Récupérer le schoolType
const school = await prisma.school.findUnique({
  where: { id: schoolId },
  select: { schoolType: true }
})

// Passer au composant
<HomeworkManagerV2 
  modules={modules} 
  schoolType={school.schoolType}
/>
```

#### attendance-management/page.tsx
```typescript
// Même chose
<AttendanceManagerV2 
  modules={modules} 
  schoolType={school.schoolType}
/>
```

---

### 3. **API Étudiants pour Groupes**

**Fichier à créer**: `app/api/student/work-groups/route.ts`

**Fonctionnalités**:
- Créer un groupe (étudiant)
- Rejoindre un groupe
- Quitter un groupe
- Inviter des membres

---

### 4. **Interface Étudiant**

**Composant à créer**: `components/student/work-group-manager.tsx`

**Fonctionnalités**:
- Voir mes groupes
- Créer un groupe
- Inviter des camarades
- Voir les devoirs de groupe

---

### 5. **Mise à Jour API Homework**

**Fichier**: `app/api/teacher/homework/route.ts`

**Modifications**:
```typescript
// GET: Inclure workGroup dans la réponse
include: {
  module: {
    include: {
      filiere: true,
    },
  },
  workGroup: {
    include: {
      members: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  },
  submissions: true,
}

// POST: Gérer assignmentType et workGroupId
const { assignmentType, workGroupId } = body

const homework = await prisma.homework.create({
  data: {
    // ... autres champs
    assignmentType,
    workGroupId,
  },
})
```

---

## 🔄 Migration Prisma

```bash
# Générer le client
npx prisma generate

# Créer et appliquer la migration
npx prisma migrate dev --name add_work_groups

# Vérifier
npx prisma studio
```

---

## 📊 Schéma de Fonctionnement

### Création de Devoir par Groupe

```
Enseignant
  ↓
Sélectionne: Filière/Classe + Module/Matière
  ↓
Choisit: Type = GROUP
  ↓
Sélectionne: Groupe A, Groupe B, Groupe C
  ↓
Crée: 3 devoirs (un par groupe)
  ↓
Chaque groupe voit son devoir
```

### Création de Groupe

```
Enseignant OU Étudiant
  ↓
Crée un groupe
  ↓
Ajoute des membres (étudiants)
  ↓
Associe à un Module/Matière (optionnel)
  ↓
Groupe disponible pour assignation de devoirs
```

---

## 🎯 Utilisation

### Enseignant - Créer un Devoir de Groupe

1. Cliquer sur "Nouveau Devoir"
2. Sélectionner Filière/Classe
3. Sélectionner Module/Matière
4. Choisir "Groupe" comme type
5. Cocher les groupes concernés
6. Remplir titre, description, date
7. (Optionnel) Uploader un fichier
8. Cliquer sur "Créer le Devoir"

### Enseignant - Créer un Groupe

1. Cliquer sur "Nouveau Groupe"
2. Entrer le nom du groupe
3. Sélectionner Filière/Classe (optionnel)
4. Sélectionner Module/Matière (optionnel)
5. Cliquer sur "Créer le Groupe"
6. (À venir) Ajouter des membres

### Voir les Devoirs Reçus

1. Aller dans "Devoirs"
2. Cliquer sur l'onglet "Devoirs Reçus"
3. Voir les devoirs assignés aux groupes

---

## 📝 Exemples de Données

### Université
- **Filière**: L3 Informatique
- **Module**: Programmation Web
- **Groupe**: Groupe A (5 étudiants)
- **Devoir**: Projet React (groupe)

### Lycée
- **Classe**: Terminale S1
- **Matière**: Mathématiques
- **Groupe**: Groupe 1 (4 élèves)
- **Devoir**: Exercices Chapitre 3 (groupe)

---

## 🚀 Prochaines Étapes

1. ✅ Modèles Prisma créés
2. ✅ API work-groups créée
3. ✅ HomeworkManager V2 créé
4. ⏳ Créer AttendanceManager V2
5. ⏳ Mettre à jour les pages
6. ⏳ Créer API étudiant pour groupes
7. ⏳ Créer interface étudiant
8. ⏳ Tester avec données réelles

---

## 📚 Documentation

- `TEACHER_FEATURES.md` - Fonctionnalités enseignant
- `IMPLEMENTATION_SUMMARY.md` - Résumé implémentation
- `WORK_GROUPS_IMPLEMENTATION.md` - Ce fichier

---

**Implémentation des Groupes de Travail - En cours** 🚧
