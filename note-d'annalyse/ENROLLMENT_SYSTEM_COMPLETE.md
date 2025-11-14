# Système d'Enrôlement Complet - 3 Novembre 2025

## 🎯 Objectif
Mettre en place un système complet d'enrôlement avec génération automatique d'ID d'enrôlement pour les étudiants et parents.

## 📋 Architecture du Système

### 1. Génération d'ID d'Enrôlement

#### Format Standard
```
ENR-YYYY-XXXXX
Exemple: ENR-2024-A3B5C
```

#### Fonction de Génération
- **Fichier**: `lib/enrollment-utils.ts`
- **Fonction**: `generateEnrollmentId()`
- **Format**: Année + 5 caractères alphanumériques (sans voyelles ambiguës)

### 2. Flux d'Enrôlement

#### Pour les Étudiants

**Étape 1: Admin crée l'étudiant**
```typescript
POST /api/school-admin/students
{
  firstName: "Jean",
  lastName: "Dupont",
  studentNumber: "STU2024001",
  niveau: "L1",
  filiereId: "xxx",
  schoolId: "xxx",
  createWithoutAccount: true  // ⭐ Mode sans compte
}
```

**Réponse:**
```json
{
  "success": true,
  "student": { ... },
  "enrollmentId": "ENR-2024-A3B5C",
  "message": "Étudiant créé. ID d'enrôlement: ENR-2024-A3B5C"
}
```

**Étape 2: Étudiant s'enrôle**
1. Va sur `/enroll`
2. Entre son `enrollmentId`
3. Sélectionne "Je suis Étudiant"
4. Vérifie son ID via `POST /api/enroll/verify`
5. Crée son compte via `POST /api/enroll/create`

#### Pour les Parents

**Étape 1: Admin crée le parent**
```typescript
POST /api/school-admin/parents
{
  firstName: "Marie",
  lastName: "Dupont",
  phone: "+237 6XX XXX XXX",
  studentIds: ["student_id_1", "student_id_2"],
  schoolId: "xxx"
}
```

**Réponse:**
```json
{
  "success": true,
  "parent": { ... },
  "enrollmentId": "ENR-2024-B7K9M",
  "message": "Parent créé. ID d'enrôlement: ENR-2024-B7K9M"
}
```

**Étape 2: Parent s'enrôle**
1. Va sur `/enroll`
2. Entre son `enrollmentId`
3. Sélectionne "Je suis Parent"
4. Vérifie son ID via `POST /api/enroll/verify`
5. Crée son compte via `POST /api/enroll/create`

## 🔧 APIs Modifiées/Créées

### 1. `app/api/school-admin/students/route.ts` ✅
**Modifications:**
- ✅ Import de `generateEnrollmentId()`
- ✅ Ajout du paramètre `createWithoutAccount`
- ✅ **Mode 1**: Créer étudiant SANS compte (`isEnrolled: false`, `userId: null`)
- ✅ **Mode 2**: Créer étudiant AVEC compte (`isEnrolled: true`, `userId: xxx`)
- ✅ Génération automatique d'`enrollmentId` dans les 2 modes

### 2. `app/api/school-admin/parents/route.ts` ⭐ NOUVEAU
**Fonctionnalités:**
- ✅ `POST`: Créer un parent sans compte avec `enrollmentId`
- ✅ `GET`: Récupérer tous les parents d'une école
- ✅ Association avec plusieurs étudiants
- ✅ Validation des étudiants
- ✅ Génération automatique d'`enrollmentId`

### 3. `app/enroll/page.tsx` ✅
**Déjà fonctionnel:**
- ✅ Vérification d'ID en temps réel
- ✅ Support étudiant ET parent
- ✅ Validation complète
- ✅ Création de compte sécurisée

### 4. `app/api/enroll/verify/route.ts` ✅
**Déjà fonctionnel:**
- ✅ Vérifie l'existence de l'`enrollmentId`
- ✅ Vérifie que `isEnrolled === false`
- ✅ Retourne les infos de l'école/filière

### 5. `app/api/enroll/create/route.ts` ✅
**Déjà fonctionnel:**
- ✅ Crée le compte utilisateur
- ✅ Associe le compte à l'étudiant/parent
- ✅ Met `isEnrolled = true`
- ✅ Hash du mot de passe

## 📊 Schéma de Base de Données

### Student
```prisma
model Student {
  id            String   @id @default(cuid())
  studentNumber String
  enrollmentId  String   @unique  // ⭐ ID pour s'enrôler
  userId        String?  @unique  // Null si pas encore enrôlé
  isEnrolled    Boolean  @default(false)  // ⭐ True après enrôlement
  // ... autres champs
}
```

### Parent
```prisma
model Parent {
  id           String   @id @default(cuid())
  enrollmentId String   @unique  // ⭐ ID pour s'enrôler
  userId       String?  @unique  // Null si pas encore enrôlé
  isEnrolled   Boolean  @default(false)  // ⭐ True après enrôlement
  students     Student[] @relation("StudentParents")
  // ... autres champs
}
```

## 🎨 Interface Utilisateur

### Page d'Enrôlement (`/enroll`)

**Étape 1: Vérification ID**
```
┌─────────────────────────────────────┐
│  🎓 Enrôlement                      │
│                                     │
│  ID d'enrôlement:                   │
│  [ENR-2024-_____]                   │
│                                     │
│  [Je suis Étudiant] [Je suis Parent]│
│                                     │
│  [Vérifier l'ID]                    │
└─────────────────────────────────────┘
```

**Étape 2: Création de Compte**
```
┌─────────────────────────────────────┐
│  Informations de l'inscription      │
│  École: Université de Yaoundé       │
│  Matricule: STU2024001              │
│  Filière: Informatique              │
│                                     │
│  Nom: [_______]  Prénom: [_______] │
│  Email: [___________________]       │
│  Téléphone: [_______________]       │
│  Mot de passe: [____________]       │
│  Confirmer: [_______________]       │
│                                     │
│  [Créer mon compte]                 │
└─────────────────────────────────────┘
```

## 🔐 Sécurité

### Validations
- ✅ Format d'`enrollmentId` validé (regex)
- ✅ Vérification d'unicité de l'ID
- ✅ Vérification que l'étudiant/parent n'est pas déjà enrôlé
- ✅ Hash bcrypt des mots de passe
- ✅ Validation email/téléphone selon type d'école
- ✅ Mot de passe minimum 8 caractères

### Permissions
- ✅ Seuls SCHOOL_ADMIN et SUPER_ADMIN peuvent créer étudiants/parents
- ✅ Vérification d'accès à l'école (schoolId)
- ✅ Validation des associations étudiant-parent

## 📝 Workflow Complet

### Scénario 1: Nouvel Étudiant

1. **Admin** crée l'étudiant avec `createWithoutAccount: true`
2. **Système** génère `ENR-2024-A3B5C`
3. **Admin** communique l'ID à l'étudiant (email, SMS, papier)
4. **Étudiant** va sur `/enroll`
5. **Étudiant** entre son ID et crée son compte
6. **Système** active le compte (`isEnrolled: true`)
7. **Étudiant** peut se connecter

### Scénario 2: Parent d'Étudiant

1. **Admin** crée le parent avec `studentIds: ["xxx"]`
2. **Système** génère `ENR-2024-B7K9M`
3. **Admin** communique l'ID au parent
4. **Parent** va sur `/enroll`
5. **Parent** entre son ID et crée son compte
6. **Système** active le compte (`isEnrolled: true`)
7. **Parent** peut suivre ses enfants

### Scénario 3: Étudiant avec Compte Direct (Mode Actuel)

1. **Admin** crée l'étudiant avec `createWithoutAccount: false` (ou omis)
2. **Système** crée le compte automatiquement
3. **Système** génère email et mot de passe (matricule)
4. **Admin** envoie les identifiants
5. **Étudiant** se connecte directement

## 🚀 Avantages du Système

### Pour l'Administration
- ✅ Contrôle total sur qui peut s'enrôler
- ✅ Pas besoin de créer les comptes manuellement
- ✅ Traçabilité via `enrollmentId`
- ✅ Flexibilité: 2 modes de création

### Pour les Étudiants/Parents
- ✅ Processus simple et guidé
- ✅ Création de leur propre mot de passe
- ✅ Validation en temps réel
- ✅ Messages d'erreur clairs

### Pour le Système
- ✅ IDs uniques et sécurisés
- ✅ Pas de collision possible
- ✅ Format standardisé
- ✅ Facile à communiquer (pas de caractères ambigus)

## 📦 Fichiers Créés/Modifiés

### Créés
1. ✅ `app/api/school-admin/parents/route.ts`

### Modifiés
1. ✅ `app/api/school-admin/students/route.ts`
2. ✅ `app/enroll/page.tsx` (déjà fait précédemment)

### Existants (Déjà Fonctionnels)
1. ✅ `lib/enrollment-utils.ts`
2. ✅ `app/api/enroll/verify/route.ts`
3. ✅ `app/api/enroll/create/route.ts`

## 🎯 Prochaines Étapes Recommandées

### 1. Interface Admin
- [ ] Ajouter bouton "Créer sans compte" dans le formulaire étudiant
- [ ] Ajouter formulaire de création de parent
- [ ] Afficher l'`enrollmentId` dans les listes
- [ ] Bouton "Copier l'ID" pour faciliter la communication

### 2. Communication
- [ ] Template email avec l'`enrollmentId`
- [ ] Template SMS avec l'`enrollmentId`
- [ ] PDF imprimable avec l'`enrollmentId`

### 3. Suivi
- [ ] Dashboard des enrôlements en attente
- [ ] Statistiques d'enrôlement
- [ ] Relances automatiques

## ✅ Statut Final

- ✅ **Génération d'ID**: Fonctionnel
- ✅ **API Étudiants**: 2 modes disponibles
- ✅ **API Parents**: Créée et fonctionnelle
- ✅ **Page Enrôlement**: Complète et testée
- ✅ **Validation**: Complète
- ✅ **Sécurité**: Implémentée

---
**Date**: 3 Novembre 2025  
**Statut**: ✅ SYSTÈME COMPLET ET OPÉRATIONNEL
