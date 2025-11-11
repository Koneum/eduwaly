# 📖 GUIDE D'UTILISATION - Système de Notation

**Version**: 2.0  
**Date**: 10 novembre 2025  
**Statut**: ✅ Production Ready

---

## 🎯 VUE D'ENSEMBLE

Ce guide explique comment utiliser le système de notation configurable pour:
- **Admins**: Configurer le système et générer des bulletins
- **Enseignants**: Saisir les notes et consulter les étudiants
- **Développeurs**: Intégrer et personnaliser

---

## 👨‍💼 GUIDE ADMIN

### **1. Initialisation (Première Utilisation)**

#### **Étape 1.1: Exécuter le Seed**
```bash
cd "d:\react\UE-GI app\schooly"
npx ts-node scripts/seed-grading-system.ts
```

**Ce script va**:
- ✅ Configurer le système (Trimestriel/Semestriel)
- ✅ Créer les types d'évaluations par défaut
- ✅ Créer les périodes de notation
- ✅ Mettre à jour les étudiants existants

**Résultat attendu**:
```
🌱 Démarrage du seed du système de notation...
📚 1 école(s) trouvée(s)

🏫 Traitement de l'école: Mon École (Université)
  ✅ Système: SEMESTER, Formule: (examens + devoirs + projets) / 3
  ✅ 4 types d'évaluations créés
  ✅ 2 périodes créées
  ✅ 15 étudiants mis à jour avec enrollmentYear

✅ Seed terminé avec succès!
```

---

### **2. Configuration du Système**

#### **Accès**: `/admin/[schoolId]/settings/grading`

#### **Étape 2.1: Choisir le Système**
1. Cliquer sur "Configuration Notation" dans le menu
2. Sélectionner **Trimestriel** ou **Semestriel**
3. Cliquer "Sauvegarder"

**Recommandations**:
- **Lycée**: Trimestriel (3 périodes)
- **Université**: Semestriel (2 périodes)

---

#### **Étape 2.2: Définir la Formule**
1. Dans le champ "Formule de calcul"
2. Entrer une formule mathématique

**Exemples de formules**:

**Lycée (poids devoirs x2)**:
```
(examens + devoirs * 2) / 3
```

**Université (moyenne simple)**:
```
(examens + devoirs + projets) / 3
```

**Université (poids examens x2)**:
```
(examens * 2 + devoirs + projets) / 4
```

**Variables disponibles**:
- `examens` - Moyenne des examens
- `devoirs` - Moyenne des devoirs
- `projets` - Moyenne des projets

**Opérateurs autorisés**:
- `+` Addition
- `-` Soustraction
- `*` Multiplication
- `/` Division
- `()` Parenthèses

---

#### **Étape 2.3: Créer les Types d'Évaluations**

1. Cliquer sur "Ajouter un type"
2. Remplir le formulaire:
   - **Nom**: Ex: "Devoir", "Examen", "Projet", "TP"
   - **Catégorie**: HOMEWORK ou EXAM
   - **Poids**: Ex: 1.0, 2.0, 1.5

**Exemples**:

**Lycée**:
| Nom | Catégorie | Poids |
|-----|-----------|-------|
| Devoir | HOMEWORK | 2.0 |
| Examen | EXAM | 1.0 |

**Université**:
| Nom | Catégorie | Poids |
|-----|-----------|-------|
| Devoir | HOMEWORK | 1.0 |
| Examen | EXAM | 1.0 |
| Projet | HOMEWORK | 1.0 |
| TP | HOMEWORK | 1.0 |

3. Cliquer "Créer"

**Actions disponibles**:
- ✏️ Modifier un type
- 🗑️ Supprimer un type
- 👁️ Activer/Désactiver

---

#### **Étape 2.4: Créer les Périodes**

1. Cliquer sur "Ajouter une période"
2. Remplir le formulaire:
   - **Nom**: Ex: "Trimestre 1", "Semestre 1"
   - **Date début**: Ex: 01/09/2025
   - **Date fin**: Ex: 15/12/2025

**Exemples**:

**Lycée (Trimestriel)**:
| Nom | Début | Fin |
|-----|-------|-----|
| Trimestre 1 | 01/09 | 15/12 |
| Trimestre 2 | 05/01 | 31/03 |
| Trimestre 3 | 01/04 | 30/06 |

**Université (Semestriel)**:
| Nom | Début | Fin |
|-----|-------|-----|
| Semestre 1 | 01/09 | 31/01 |
| Semestre 2 | 01/02 | 30/06 |

3. Cliquer "Créer"

**Actions disponibles**:
- ✏️ Modifier une période
- 👁️ Activer/Désactiver

---

### **3. Génération de Bulletins**

#### **Accès**: `/admin/[schoolId]/bulletins`

#### **Étape 3.1: Sélectionner les Critères**

1. **Période**: Choisir la période (ex: "Trimestre 1")
2. **Filière** (optionnel): Filtrer par filière
3. **Étudiant** (optionnel): Sélectionner un étudiant spécifique

**Cas d'usage**:
- **Tous les étudiants**: Ne rien sélectionner
- **Une filière**: Sélectionner la filière
- **Un étudiant**: Sélectionner l'étudiant

---

#### **Étape 3.2: Personnaliser le Template**

1. Cliquer sur l'onglet "Templates PDF"
2. Configurer:

**En-tête**:
- ☑️ Afficher le logo
- Position: Gauche / Centre / Droite
- Couleur: Choisir une couleur
- ☑️ Afficher adresse/téléphone/email

**Tableau**:
- Style: Simple / Rayé / Bordures
- Couleur en-tête: Choisir une couleur

**Pied de page**:
- Texte personnalisé
- ☑️ Afficher signatures

3. Cliquer "Sauvegarder Template"

---

#### **Étape 3.3: Générer les Bulletins**

1. Cliquer sur "Aperçu" pour voir un exemple
2. Cliquer sur "Générer PDF" pour télécharger

**Résultat**:
- PDF téléchargé avec:
  - Logo école
  - Informations étudiant
  - Tableau des notes par matière
  - Moyenne générale
  - Appréciation automatique
  - Signatures (si activé)

**Appréciations automatiques**:
- ≥ 16: Excellent
- ≥ 14: Très bien
- ≥ 12: Bien
- ≥ 10: Assez bien
- < 10: Insuffisant

---

### **4. Gestion des Horaires (Universités)**

#### **Étape 4.1: Voir les Étudiants par Horaire**

1. Aller sur `/admin/[schoolId]/students`
2. Utiliser les onglets:
   - **Cours du Jour**: Étudiants DAY
   - **Cours du Soir**: Étudiants EVENING

**Compteurs**:
- Nombre d'étudiants par onglet
- Total visible en temps réel

---

#### **Étape 4.2: Inscrire un Étudiant**

1. Cliquer sur "Nouvel étudiant"
2. Remplir le formulaire
3. **Pour les universités**: Choisir l'horaire
   - ⭕ Cours du Jour
   - ⭕ Cours du Soir
4. Cliquer "Inscrire"

**Note**: Le choix d'horaire n'est visible que pour les universités.

---

## 👨‍🏫 GUIDE ENSEIGNANT

### **1. Consulter les Étudiants**

#### **Accès**: `/teacher/[schoolId]/grades`

#### **Étape 1.1: Filtrer par Filière**

1. Utiliser le dropdown "Filière"
2. Sélectionner une filière
3. La liste se met à jour automatiquement

**Affichage**:
- Nom étudiant
- Matricule
- Niveau
- Filière (badge)
- Promotion (badge, ex: "2021-2022")

---

#### **Étape 1.2: Rechercher un Étudiant**

1. Utiliser la barre de recherche
2. Taper nom ou matricule
3. Résultats en temps réel

**Recherche**:
- Insensible à la casse
- Recherche dans nom ET matricule
- Mise à jour instantanée

---

### **2. Saisir les Notes**

1. Cliquer sur un étudiant
2. Sélectionner le module
3. Choisir le type d'évaluation
4. Entrer la note (0-20)
5. Cliquer "Enregistrer"

**Validation**:
- Note entre 0 et 20
- Type d'évaluation requis
- Module requis

---

## 💻 GUIDE DÉVELOPPEUR

### **1. Utiliser la Bibliothèque PDF**

```typescript
import { generateBulletinPDF } from '@/lib/pdf-generator'

// Générer un bulletin
const pdfBlob = await generateBulletinPDF(
  school,
  student,
  period,
  moduleGrades,
  generalAverage,
  {
    showLogo: true,
    logoPosition: 'center',
    headerColor: '#1e40af',
    tableStyle: 'striped',
    showSignatures: true
  }
)

// Télécharger le PDF
const url = URL.createObjectURL(pdfBlob)
const a = document.createElement('a')
a.href = url
a.download = `bulletin-${student.name}.pdf`
a.click()
```

---

### **2. Évaluer une Formule**

```typescript
import { evaluate } from 'mathjs'

// Formule sécurisée
const formula = '(examens + devoirs * 2) / 3'
const result = evaluate(formula, {
  examens: 15,
  devoirs: 14,
  projets: 0
})

console.log(result) // 14.333...
```

---

### **3. Créer un Type d'Évaluation**

```typescript
const response = await fetch('/api/admin/grading/evaluation-types', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    schoolId: 'xxx',
    name: 'Projet',
    category: 'HOMEWORK',
    weight: 1.5
  })
})

const data = await response.json()
```

---

### **4. Créer une Période**

```typescript
const response = await fetch('/api/admin/grading/periods', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    schoolId: 'xxx',
    name: 'Trimestre 1',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-12-15')
  })
})

const data = await response.json()
```

---

## 🔧 DÉPANNAGE

### **Problème: "Unknown field 'enrollmentYear'"**

**Solution**:
```bash
# Régénérer le client Prisma
npx prisma generate

# Redémarrer le serveur
npm run dev
```

---

### **Problème: "Formule invalide"**

**Causes possibles**:
- Syntaxe incorrecte
- Variable inexistante
- Opérateur non autorisé

**Solution**:
```typescript
// ✅ CORRECT
(examens + devoirs * 2) / 3

// ❌ INCORRECT
examens + devoirs * 2 / 3  // Manque parenthèses
(examens + devoirs) / 0    // Division par zéro
(examens + notes) / 2      // Variable 'notes' n'existe pas
```

---

### **Problème: "PDF ne se génère pas"**

**Vérifications**:
1. Vérifier que pdfmake est installé
2. Vérifier les données (notes, étudiant, période)
3. Consulter la console pour les erreurs

**Solution**:
```bash
# Réinstaller pdfmake
npm install pdfmake @types/pdfmake
```

---

## 📚 RESSOURCES

### **Documentation**:
- `IMPLEMENTATION_COMPLETE_STATUS.md` - Statut complet
- `QUICK_START_GRADING.md` - Démarrage rapide
- `NEXT_STEPS_GRADING_SYSTEM.md` - Prochaines étapes
- `README_GRADING_SYSTEM.md` - Vue d'ensemble

### **Scripts**:
- `scripts/seed-grading-system.ts` - Initialisation données

### **APIs**:
- `/api/admin/grading/system` - Configuration
- `/api/admin/grading/evaluation-types` - Types
- `/api/admin/grading/periods` - Périodes
- `/api/admin/bulletins/generate` - Bulletins

---

## ✅ CHECKLIST UTILISATION

### **Admin - Première Utilisation**
- [ ] Exécuter le seed
- [ ] Vérifier la configuration système
- [ ] Vérifier les types d'évaluations
- [ ] Vérifier les périodes
- [ ] Tester génération bulletin

### **Admin - Utilisation Courante**
- [ ] Générer bulletins fin de période
- [ ] Personnaliser templates si besoin
- [ ] Consulter les moyennes
- [ ] Exporter les bulletins

### **Enseignant - Utilisation Courante**
- [ ] Saisir les notes régulièrement
- [ ] Filtrer par filière
- [ ] Vérifier les moyennes
- [ ] Consulter les promotions

---

## 🎉 CONCLUSION

Le système de notation est maintenant prêt à l'emploi avec:
- ✅ Configuration flexible
- ✅ Calcul automatique sécurisé
- ✅ Génération PDF professionnelle
- ✅ Interface intuitive
- ✅ Documentation complète

**Besoin d'aide ?** Consultez les autres guides ou contactez le support technique.
