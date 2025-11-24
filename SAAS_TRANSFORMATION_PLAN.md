# SAAS_TRANSFORMATION_PLAN

## 1. Vue d’ensemble

Application Schooly multi-établissements (universités + lycées) avec : gestion des écoles, utilisateurs (admins, enseignants, étudiants, parents), scolarité, devoirs, bulletins, paiements, reporting de base.

Ce plan suit la chaîne prioritaire définie par le client et indique l’état actuel (✔️ terminé, ⏳ en cours, ⭕ à faire).

---

## 2. Fonctionnalités principales existantes (résumé)

- **Gestion des écoles & abonnements**
- **Utilisateurs & rôles** : SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT…
- **Étudiants & parents**
  - Création d’étudiants avec `studentNumber`, `niveau`, `filiere`, `courseSchedule` (DAY / EVENING)
  - Lien étudiant ↔ parent via `enrollmentId`
- **Scolarité & finance**
  - Modèle `FeeStructure` (frais par école, type, niveau optionnel, filière optionnelle, année académique)
  - Modèle `StudentPayment` (montants dus/payés, statut, dueDate, paidAt…)
  - Page `FinanceSettings` avec gestion des frais et des bourses
  - Intégration VitePay (API paiement mobile) côté serveur
- **Grille / notes & bulletins**
  - Périodes, types d’évaluation, bulletins PDF, certificats (structure en place)
- **Devoirs & soumissions**
  - Devoirs (`Homework`) + `Submission` avec statut PENDING/SUBMITTED/GRADED
  - Pages élèves et enseignants pour gérer devoirs et soumissions
- **Emploi du temps**
  - Modèles et UI de base déjà en place (à améliorer)
- **Upload de fichiers**
  - Upload générique vers S3 + système de permissions d’upload personnalisées
  - Upload pour devoirs (soumissions)
- **UI & UX**
  - Design responsive global (pages étudiants, managers, formulaire d’enrôlement)
  - Dark mode

---

## 3. Chaîne d’implémentation prioritaire

### 3.1 Finaliser les Permissions (Étape 1)

- [✔️] Implémenter `PermissionButton` dans toutes les pages nécessaires
  - [✔️] Enseignants (page.tsx)
  - [✔️] Modules (page.tsx)
  - [✔️] Filières (page.tsx)
  - [✔️] Emploi du temps (page.tsx)
  - [✔️] Finance (financial-overview/page.tsx)
- [✔️] Mettre à jour la navigation avec `PermissionNavItem`
- [✔️] Ajouter vérification côté serveur dans toutes les APIs critiques

**Statut global Étape 1**: ✔️ Terminé.

---

### 3.2 Communication (Étape 2)

- [✔️] Système de messagerie interne (UI + flux métier)
- [✔️] Notifications (logique principale en place)

**Statut global Étape 2**: ✔️ Terminé.

---

### 3.3 Upload de Fichiers (Étape 3)

- [✔️] Configuration AWS S3 de base
- [✔️] API upload générique (`/api/upload`) + permissions custom (`/api/admin/upload-permissions`)
- [✔️] Composant `FileUpload` générique unifié
- [✔️] Intégration uniforme dans les pages (devoirs, ressources, documents administratifs…)
- [✔️] Partage ressources pédagogiques (enseignant → étudiant)
  - [✔️] Téléchargement de documents pour les étudiants/parents

**Statut global Étape 3**: ✔️ Terminé.

---

### 3.4 Reporting (Étape 4)

- [✔️] Bulletins de notes PDF (génération complète et stable)
- [✔️] Certificats de scolarité (génération PDF)
- [✔️] Rapports statistiques avancés (inscriptions, paiements, performances…)

**Statut global Étape 4**: ✔️ Terminé.

---

### 3.5 Devoirs & Soumissions (Étape 5)

- [✔️] Création de devoirs par les enseignants
- [✔️] Soumission texte/fichier par les étudiants
- [✔️] Upload de fichiers pour soumissions (intégration complète avec S3 + UI unifiée)

**Statut global Étape 5**: ✔️ Terminé.

---

## 4. Inscription & Comptes Étudiants / Parents (État actuel)

- **Étudiants**
  - `Student` comporte : `studentNumber`, `enrollmentId`, `niveau`, `filiereId`, `enrollmentYear?`, `courseSchedule`, `isEnrolled`, etc.
  - Création via API `POST /api/school-admin/students` avec génération automatique de `enrollmentId` et lien parent.
- **Parents**
  - Modèle `Parent` lié à un ou plusieurs `Student` via `enrollmentId`.
  - Compte utilisateur parent créé ultérieurement.
- **Comptes & activation**
  - `Student.userId`/`Parent.userId` créés à l’enrôlement, `isEnrolled` gère l’état d’inscription.
  - L’activation liée explicitement au paiement n’est pas encore codée.

---

## 5. Tâche en cours – Refactor Inscription & Scolarité

### 5.1 Objectifs métier

1. **Numéro étudiant standardisé**
   - Format: `IUFP-2025-0001`
   - `IUFP` = sigle de l’établissement
   - `2025` = promotion / année d’entrée
   - `0001` = rang d’inscription (compteur séquentiel par école + promotion)

2. **Activation des comptes étudiant & parent après paiement**
   - Même si les comptes sont créés (ou le numéro étudiant saisi), **le compte reste inactif** tant que les frais de scolarité ne sont pas payés.
   - Tant que non payé, afficher sur le portail concerné :
     - `Veuillez payer vos frais de scolarité`.

3. **Frais de scolarité par niveau**
   - Reconfigurer les frais selon les niveaux (`L1`, `L2`, `L3`, etc.)
   - Même logique pour les lycées (niveaux 10E, 11E, 12E, etc.).
   - S’appuyer sur le champ `niveau` déjà présent dans `FeeStructure` et `Student`.

4. **Nouveau champ Statut (optionnel) à l’inscription**
   - `statut`: `REGULIER`, `PROFESSIONNEL`, `CL` (Candidat Libre), `PROFESSIONNEL_ETAT` (ou similaire).
   - Champ stocké sur le modèle `Student` (ou relié) et disponible dans les écrans d’admin & de reporting.

### 5.2 Plan technique (haut niveau)

- **Modèle & base de données**
  - Ajouter un mécanisme de génération de `studentNumber` au format demandé (par école + année/promotion).
  - Ajouter le champ `statut` sur `Student` (enum ou String contrôlée).
  - Lier l’activation des comptes (`User` / `Student.isEnrolled` / `Parent.isEnrolled`) au statut des paiements (`StudentPayment`).

- **APIs & logique métier**
  - Adapter `POST /api/school-admin/students` et les routes de paiement pour:
    - générer et retourner le nouveau `studentNumber`.
    - activer les comptes quand les frais de scolarité de base sont payés.

- **Front-end**
  - Mettre à jour les formulaires d’inscription / enrôlement (admin + self-service si applicable).
  - Afficher le message `Veuillez payer vos frais de scolarite` tant que le paiement n’est pas réglé.
  - Gérer la saisie/affichage du `statut` et l’affichage des frais par niveau.

**Statut global de cette tâche**: ⏳ En cours (backend en implémentation).

---

## 6. Prochaine étape

Après validation par le client de ce plan (en particulier de la section 5), démarrer :

- Mise à jour du modèle (Prisma) pour :
  - génération du nouveau `studentNumber`,
  - ajout du champ `statut`,
  - liaison activation ↔ paiements.
- Puis ajustement des APIs et de l’UI correspondante.
