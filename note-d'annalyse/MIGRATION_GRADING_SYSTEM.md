# 📋 MIGRATION - Système de Notation Configurable

## **Date**: 9 Novembre 2025

## **Objectif**
Implémenter un système de notation flexible permettant à chaque école de configurer :
- Son système (Trimestriel/Semestriel)
- Sa formule de calcul personnalisée
- Ses types d'évaluations
- Ses périodes de notation
- La gestion cours jour/soir (universités)
- L'année d'inscription (promotion) des étudiants

---

## **1. Modifications Schéma Prisma**

### **A. Modèle `Student`**
```prisma
model Student {
  // ... champs existants
  
  // NOUVEAUX CHAMPS
  enrollmentYear    Int?              // Année d'inscription (ex: 2021)
  courseSchedule    CourseSchedule    @default(DAY) // DAY ou EVENING
}
```

**Calcul Promotion** :
```typescript
const promotion = `${student.enrollmentYear}-${student.enrollmentYear + 1}`
// Exemple: "2021-2022"
```

### **B. Modèle `School`**
```prisma
model School {
  // ... champs existants
  
  // NOUVEAUX CHAMPS
  gradingSystem     GradingSystem     @default(SEMESTER) // TRIMESTER ou SEMESTER
  gradingFormula    String?           // Formule personnalisée
  
  // NOUVELLES RELATIONS
  gradingPeriods    GradingPeriod[]   // Périodes de notation
  evaluationTypes   EvaluationType[]  // Types d'évaluations
}
```

### **C. Nouveaux Modèles**

#### **GradingPeriod** (Périodes de Notation)
```prisma
model GradingPeriod {
  id          String    @id @default(cuid())
  schoolId    String
  school      School    @relation(...)
  name        String    // "Trimestre 1", "Semestre 1"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean   @default(true)
}
```

**Périodes par Défaut** :

**Lycée (Trimestriel)** :
- Trimestre 1 : Sept-Déc
- Trimestre 2 : Jan-Mars
- Trimestre 3 : Avril-Juin

**Université (Semestriel)** :
- Semestre 1 : Sept-Jan
- Semestre 2 : Fév-Juin

#### **EvaluationType** (Types d'Évaluations)
```prisma
model EvaluationType {
  id          String    @id @default(cuid())
  schoolId    String
  school      School    @relation(...)
  name        String    // "Devoir", "Examen", "Projet", "TP"
  category    String    // "HOMEWORK" ou "EXAM"
  weight      Float     @default(1.0) // Poids dans le calcul
  isActive    Boolean   @default(true)
}
```

**Types par Défaut** :

**Lycée** :
- Devoir (category: HOMEWORK, weight: 2.0)
- Examen (category: EXAM, weight: 1.0)

**Université** :
- Devoir (category: HOMEWORK, weight: 1.0)
- Examen (category: EXAM, weight: 1.0)
- Projet (category: HOMEWORK, weight: 1.0)
- TP (category: HOMEWORK, weight: 1.0)

### **D. Nouveaux Enums**
```prisma
enum CourseSchedule {
  DAY      // Cours du jour
  EVENING  // Cours du soir
}

enum GradingSystem {
  TRIMESTER  // Système trimestriel (lycées)
  SEMESTER   // Système semestriel (universités)
}
```

---

## **2. Commandes Migration**

```bash
# 1. Générer la migration
npx prisma migrate dev --name add_grading_system

# 2. Générer le client Prisma
npx prisma generate

# 3. Seed les données par défaut (optionnel)
npx prisma db seed
```

---

## **3. Système de Calcul des Notes**

### **Formule Configurable**
L'admin-school définit la formule dans `school.gradingFormula` :

**Exemple Lycée** :
```
(examens + devoirs * 2) / 3
```

**Exemple Université** :
```
(examens + devoirs) / 2
```

### **Algorithme de Calcul**
```typescript
// 1. Récupérer les types d'évaluations de l'école
const evalTypes = await prisma.evaluationType.findMany({
  where: { schoolId, isActive: true }
})

// 2. Grouper les notes par catégorie
const homeworkNotes = evaluations
  .filter(e => evalTypes.find(t => t.name === e.type && t.category === 'HOMEWORK'))
  .map(e => e.note * evalTypes.find(t => t.name === e.type)!.weight)

const examNotes = evaluations
  .filter(e => evalTypes.find(t => t.name === e.type && t.category === 'EXAM'))
  .map(e => e.note * evalTypes.find(t => t.name === e.type)!.weight)

// 3. Calculer moyennes pondérées
const avgHomework = sum(homeworkNotes) / homeworkNotes.length
const avgExam = sum(examNotes) / examNotes.length

// 4. Appliquer la formule de l'école
const finalGrade = eval(school.gradingFormula
  .replace('devoirs', avgHomework)
  .replace('examens', avgExam)
)
```

---

## **4. Interface Admin - Configuration**

### **Page** : `/admin/[schoolId]/settings/grading`

#### **Section 1 : Système de Notation**
```tsx
<Select value={gradingSystem} onChange={setGradingSystem}>
  <option value="TRIMESTER">Trimestriel (3 périodes/an)</option>
  <option value="SEMESTER">Semestriel (2 périodes/an)</option>
</Select>

<Input 
  label="Formule de calcul"
  placeholder="(examens + devoirs * 2) / 3"
  value={gradingFormula}
  onChange={setGradingFormula}
/>
```

#### **Section 2 : Types d'Évaluations**
```tsx
<Table>
  <thead>
    <tr>
      <th>Nom</th>
      <th>Catégorie</th>
      <th>Poids</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {evaluationTypes.map(type => (
      <tr key={type.id}>
        <td>{type.name}</td>
        <td>{type.category}</td>
        <td>{type.weight}</td>
        <td>
          <Button onClick={() => editType(type)}>Modifier</Button>
          <Button onClick={() => deleteType(type.id)}>Supprimer</Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>

<Button onClick={addNewType}>+ Ajouter Type</Button>
```

#### **Section 3 : Périodes de Notation**
```tsx
<Table>
  <thead>
    <tr>
      <th>Nom</th>
      <th>Début</th>
      <th>Fin</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {gradingPeriods.map(period => (
      <tr key={period.id}>
        <td>{period.name}</td>
        <td>{format(period.startDate, 'dd/MM/yyyy')}</td>
        <td>{format(period.endDate, 'dd/MM/yyyy')}</td>
        <td>
          <Button onClick={() => editPeriod(period)}>Modifier</Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## **5. Génération Bulletins par Admin**

### **Workflow**
1. **Teacher** saisit les notes (devoirs/examens)
2. **Admin** accède à `/admin/[schoolId]/bulletins`
3. **Admin** sélectionne :
   - Période (Trimestre/Semestre)
   - Filière/Classe (ou "Toutes")
   - Étudiant(s) (ou "Tous")
4. **Système** calcule notes finales selon formule
5. **Admin** génère PDF(s) basé sur template

### **Page** : `/admin/[schoolId]/bulletins/page.tsx`
```tsx
export default function BulletinsPage() {
  return (
    <div>
      <h1>Génération de Bulletins</h1>
      
      {/* Filtres */}
      <Card>
        <Select label="Période">
          {gradingPeriods.map(p => <option>{p.name}</option>)}
        </Select>
        
        <Select label="Filière/Classe">
          <option value="all">Toutes</option>
          {filieres.map(f => <option>{f.nom}</option>)}
        </Select>
        
        <Select label="Étudiant">
          <option value="all">Tous</option>
          {students.map(s => <option>{s.user.name}</option>)}
        </Select>
      </Card>
      
      {/* Actions */}
      <div>
        <Button onClick={generatePDF}>
          Générer Bulletin(s) PDF
        </Button>
        <Button onClick={previewBulletin}>
          Aperçu
        </Button>
      </div>
      
      {/* Liste des bulletins générés */}
      <BulletinsList bulletins={bulletins} />
    </div>
  )
}
```

---

## **6. Gestion Cours Jour/Soir**

### **Inscription Étudiant**
```tsx
// Dans le formulaire d'inscription
<Select 
  label="Horaire des cours"
  value={courseSchedule}
  onChange={setCourseSchedule}
>
  <option value="DAY">Cours du Jour</option>
  <option value="EVENING">Cours du Soir</option>
</Select>
```

### **Pages Admin/Prof avec Onglets**
```tsx
<Tabs defaultValue="day">
  <TabsList>
    <TabsTrigger value="day">
      <Sun className="h-4 w-4 mr-2" />
      Cours du Jour ({dayStudents.length})
    </TabsTrigger>
    <TabsTrigger value="evening">
      <Moon className="h-4 w-4 mr-2" />
      Cours du Soir ({eveningStudents.length})
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="day">
    <StudentsList students={dayStudents} />
  </TabsContent>
  
  <TabsContent value="evening">
    <StudentsList students={eveningStudents} />
  </TabsContent>
</Tabs>
```

---

## **7. Tâches d'Implémentation**

### **✅ Tâche 1 : Filtres Grades + Promotion**
- [x] Ajouter `enrollmentYear` au modèle Student
- [ ] Modifier formulaire inscription pour capturer année
- [ ] Ajouter filtres par classe/filière dans grades/page.tsx
- [ ] Afficher format "Nom, Filière, Promotion (2021-2022)"

### **📋 Tâche 2 : Système Notation Configurable**
- [x] Ajouter modèles GradingPeriod, EvaluationType
- [x] Ajouter champs gradingSystem, gradingFormula à School
- [ ] Créer page admin `/settings/grading`
- [ ] Implémenter CRUD types d'évaluations
- [ ] Implémenter CRUD périodes de notation
- [ ] Créer algorithme calcul notes finales
- [ ] Seed données par défaut

### **📋 Tâche 3 : Génération Bulletins Admin**
- [ ] Créer page `/admin/[schoolId]/bulletins`
- [ ] Déplacer ReportCardGenerator de teacher vers admin
- [ ] Implémenter filtres (période, filière, étudiant)
- [ ] Créer template PDF basé sur fichiers fournis
- [ ] Implémenter génération individuelle
- [ ] Implémenter génération par groupe
- [ ] Ajouter historique bulletins générés

### **📋 Tâche 4 : Cours Jour/Soir**
- [x] Ajouter enum CourseSchedule
- [x] Ajouter champ courseSchedule à Student
- [ ] Modifier formulaire inscription
- [ ] Ajouter onglets dans pages admin/prof
- [ ] Filtrer listes étudiants par horaire
- [ ] Ajouter badge visuel (Soleil/Lune)

---

## **8. APIs à Créer**

### **`/api/admin/grading/evaluation-types`**
- GET : Liste types d'évaluations
- POST : Créer nouveau type
- PUT : Modifier type
- DELETE : Supprimer type

### **`/api/admin/grading/periods`**
- GET : Liste périodes
- POST : Créer période
- PUT : Modifier période

### **`/api/admin/grading/calculate`**
- POST : Calculer notes finales
- Body : `{ studentIds, periodId }`
- Response : Notes calculées selon formule

### **`/api/admin/bulletins/generate`**
- POST : Générer bulletin(s) PDF
- Body : `{ studentIds, periodId, filiereId }`
- Response : URL(s) PDF générés

---

## **9. Tests à Effectuer**

1. ✅ Migration Prisma sans erreur
2. ✅ Seed données par défaut
3. [ ] Création types d'évaluations personnalisés
4. [ ] Calcul notes avec formule personnalisée
5. [ ] Génération bulletin individuel
6. [ ] Génération bulletins par filière
7. [ ] Filtrage étudiants jour/soir
8. [ ] Affichage promotion correcte

---

## **10. Notes Importantes**

⚠️ **Sécurité Formule** : Utiliser un parser sécurisé au lieu de `eval()` pour éviter injection de code.

💡 **Suggestion** : Utiliser `mathjs` pour parser les formules :
```typescript
import { evaluate } from 'mathjs'

const result = evaluate(school.gradingFormula, {
  devoirs: avgHomework,
  examens: avgExam
})
```

📝 **Documentation** : Créer guide utilisateur pour admin-school expliquant :
- Comment configurer le système
- Exemples de formules
- Bonnes pratiques

---

**Prochaine étape** : Exécuter la migration Prisma et commencer l'implémentation des interfaces admin.
