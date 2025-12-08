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

## 5. Refactor Inscription & Scolarité ✔️

### 5.1 Objectifs métier (tous atteints)

1. **Numéro étudiant standardisé** ✔️
   - Format: `SIGLE-YYYY-0001` (ex: `IUFP-2025-0001`)
   - `SIGLE` = sigle de l'établissement (`school.shortName` ou généré depuis `school.name`)
   - `YYYY` = promotion / année d'entrée
   - `0001` = rang d'inscription (compteur séquentiel par école + promotion)
   - **Implémentation**: `lib/student-utils.ts` → `generateStudentNumberForSchool()`

2. **Activation des comptes étudiant & parent après paiement** ✔️
   - Le compte reste inactif (`isEnrolled = false`) tant que les frais de scolarité (TUITION) ne sont pas payés.
   - Premier paiement TUITION → active automatiquement l'étudiant et ses parents.
   - Message affiché sur les portails : `Veuillez payer vos frais de scolarite pour activer votre compte`.
   - **Implémentation**: 
     - `app/api/students/payments/route.ts` (lignes 164-194)
     - `app/student/[schoolId]/page.tsx` (lignes 131-145)
     - `app/parent/[schoolId]/page.tsx`

3. **Frais de scolarité par niveau** ✔️
   - Frais configurables par niveaux (`L1`, `L2`, `L3`, `M1`, `M2`, `10E`, `11E`, `12E`)
   - Champ `niveau` présent dans `FeeStructure` et `Student`
   - Filtrage automatique des frais applicables dans le formulaire de paiement

4. **Champ Statut étudiant** ✔️
   - Enum `StudentStatus`: `REGULIER`, `PROFESSIONNEL`, `CL` (Candidat Libre), `PROFESSIONNEL_ETAT`
   - **Implémentation**:
     - Prisma: `Student.status` (enum `StudentStatus`)
     - API: `POST /api/school-admin/students` accepte le champ `status`
     - UI Admin: Sélecteur dans le formulaire de création d'étudiant
     - UI Profil: Affichage du type d'étudiant dans le profil

### 5.2 Fichiers modifiés (récapitulatif)

| Fichier | Modification |
|---------|-------------|
| `prisma/schema.prisma` | Enum `StudentStatus`, champ `Student.status` |
| `lib/student-utils.ts` | Fonction `generateStudentNumberForSchool()` |
| `app/api/school-admin/students/route.ts` | Génération numéro étudiant, support champ `status` |
| `app/api/students/payments/route.ts` | Activation compte après premier paiement TUITION |
| `app/student/[schoolId]/page.tsx` | Message blocage si non payé |
| `app/parent/[schoolId]/page.tsx` | Message blocage si non payé |
| `components/school-admin/students-manager.tsx` | Sélecteur statut + affichage profil |
| `app/admin/[schoolId]/students/page.tsx` | Typage status dans StudentRow |

**Statut global Étape 5**: ✔️ **Terminé** (7 décembre 2025)

---

## 6. Résumé Phase 1 (Complète)

| # | Étape | Statut |
|---|-------|--------|
| 1 | Finaliser les Permissions | ✔️ Terminé |
| 2 | Communication | ✔️ Terminé |
| 3 | Upload de Fichiers | ✔️ Terminé |
| 4 | Reporting | ✔️ Terminé |
| 5 | Devoirs & Soumissions | ✔️ Terminé |
| 6 | Refactor Inscription & Scolarité | ✔️ Terminé |

---

## 7. Phase 2 - Fonctionnalités Avancées (Inspirées Pronote)

### 7.1 Schéma Prisma mis à jour (7 décembre 2025)

**Nouveaux modèles créés:**

| Modèle | Description | Tables |
|--------|-------------|--------|
| `Incident` | Vie scolaire (retards, oublis, comportement) | `incidents` |
| `CalendarEvent` | Agenda scolaire (conseils, jours fériés, événements) | `calendar_events` |
| `Appointment` | RDV parent-professeur | `appointments` |
| `Poll` | Sondages | `polls` |
| `PollOption` | Options de sondage | `poll_options` |
| `PollResponse` | Réponses aux sondages | `poll_responses` |

**Modèles modifiés:**

| Modèle | Modifications |
|--------|--------------|
| `Enseignant` | + `isPrincipal`, `classId`, `appointments`, `incidents` |
| `Student` | + `incidents`, `appointments` |
| `Parent` | + `appointments` |
| `Evaluation` | + `maxPoints` (barème variable /8, /12, /20) |
| `Submission` | + `isCompleted`, `completedAt` ("J'ai terminé") |
| `Module` | + `incidents` |
| `School` | + `incidents`, `calendarEvents`, `appointments`, `polls` |

**Nouveaux enums:**

| Enum | Valeurs |
|------|---------|
| `IncidentType` | RETARD, RETARD_NON_JUSTIFIE, OUBLI_MATERIEL, COMPORTEMENT, EXCLUSION, AUTRE |
| `EventType` | CONSEIL_CLASSE, REUNION_PARENTS, JOUR_FERIE, VACANCES, EXAMEN, EVENEMENT_SPORTIF, SORTIE_SCOLAIRE, CONFERENCE, AUTRE |
| `AppointmentStatus` | PENDING, CONFIRMED, CANCELLED, COMPLETED |

### 7.2 Fonctionnalités à implémenter (Phase 2)

| Priorité | Fonctionnalité | Effort | Statut |
|----------|---------------|--------|--------|
| 🔴 P1 | Vue jour emploi du temps | 5h | ⏳ À faire |
| 🔴 P1 | Devoirs "J'ai terminé" | 3h | ⏳ À faire |
| 🔴 P1 | Équipe pédagogique (liste profs) | 4h | ⏳ À faire |
| 🔴 P1 | Menu accordéon sidebar | 4h | ⏳ À faire |
| 🟠 P2 | Carnet de correspondance (incidents) | 8h | ⏳ À faire |
| 🟠 P2 | Notes barème variable | 5h | ⏳ À faire |
| 🟠 P2 | Agenda événements | 6h | ⏳ À faire |
| 🟠 P2 | RDV parent-prof | 5h | ⏳ À faire |
| 🟢 P3 | Bulletin de classe | 6h | ⏳ À faire |
| 🟢 P3 | Sondages | 5h | ⏳ À faire |
| 🟢 P3 | Prof principal (lycée) | 3h | ⏳ À faire |

### 7.3 Différences Lycée vs Université

| Fonctionnalité | 🔵 Université | 🟢 Lycée |
|----------------|--------------|----------|
| Prof principal | Non | **Oui** (obligatoire) |
| Carnet de correspondance | Non | **Oui** |
| Conseils de classe | Rare | **Fréquent** |
| Horaires jour/soir | Oui (`courseSchedule`) | Non |
| Parents obligatoires | Non | **Oui** |
| Compétences | Non | Optionnel |

### 7.4 Prochaine étape

Après `prisma db push` ou migration, implémenter:
1. **APIs** pour les nouveaux modèles
2. **Pages UI** côté étudiant, parent, enseignant
3. **Dashboard admin** pour la gestion

**Statut global Phase 2**: ⏳ Schéma prêt, APIs et UI à implémenter

---

## 8. Mise à Jour Sécurité & Dépendances (7 décembre 2025)

### 8.1 Mises à jour des dépendances

| Package | Avant | Après | Notes |
|---------|-------|-------|-------|
| Next.js | 16.0.1 | 16.0.7 | Dernière version stable |
| Prisma | 6.18.0 | 7.1.0 | **Major update** - nouveau client |
| better-auth | 1.3.34 | 1.4.3+ | 2 vulnérabilités corrigées |
| jspdf | 2.5.2 | 3.0.4 | 2 vulnérabilités corrigées |
| zod | - | Installé | Validation des entrées |
| server-only | - | Installé | Protection code serveur |
| @prisma/adapter-pg | - | Installé | Driver Prisma 7 |

**Résultat**: `npm audit` → **0 vulnérabilités** ✅

### 8.2 Prisma 7 - Changements appliqués

| Fichier | Modification |
|---------|-------------|
| `prisma/schema.prisma` | `provider = "prisma-client"` + `output = "../lib/generated/prisma"` |
| `prisma.config.ts` | Retrait de `engine: 'classic'` |
| `lib/prisma.ts` | Utilisation de `PrismaPg` adapter + `server-only` |

### 8.3 Sécurité - Nouvelles implémentations

| Fichier | Description |
|---------|-------------|
| `middleware.ts` | Middleware global de sécurité (OWASP) |
| `next.config.ts` | Headers de sécurité + CORS sécurisé |
| `SECURITY_AUDIT_REPORT.md` | Rapport d'audit complet |

**Headers de sécurité ajoutés**:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (CSP)

### 8.4 Routes protégées par le middleware

**Authentification requise**:
- `/admin/*`, `/super-admin/*`, `/student/*`, `/parent/*`, `/teacher/*`
- `/api/*` mutations (POST, PUT, PATCH, DELETE)
- `/api/students/*`, `/api/teachers/*`, `/api/messages/*`, `/api/reports/*`

**Routes publiques**:
- `/login`, `/register`, `/enroll`, `/pricing`
- `/api/auth/*`, `/api/enroll/*`

**Statut global Étape 8**: ✅ **Terminé**

---

## 9. Phase 2 - Implémentation (8 décembre 2025)

### 9.1 Devoirs "J'ai terminé" ✅

| Fichier | Description |
|---------|-------------|
| `app/api/homework/[id]/complete/route.ts` | API PATCH/GET pour marquer un devoir comme terminé |
| `components/homework/MarkCompleteButton.tsx` | Bouton toggle client-side |
| `app/student/[schoolId]/homework/page.tsx` | Intégration bouton + statistique "Terminés" |
| `app/teacher/[schoolId]/homework/[id]/page.tsx` | Badge "Terminé" + statistique côté enseignant |

**Fonctionnalité**: L'étudiant peut marquer un devoir comme "J'ai terminé" sans forcément le soumettre. L'enseignant voit le statut dans sa vue des soumissions.

### 9.2 Menu Accordéon Sidebar ✅

| Fichier | Description |
|---------|-------------|
| `components/nav-accordion.tsx` | Composant accordéon réutilisable |
| `components/admin-school-nav.tsx` | Refactorisé avec groupes accordéon |

**Groupes créés**:
- 🎓 **Académique**: Étudiants, Emplois du Temps, Filières/Séries, Modules/Matières, Salles/Classes
- 👥 **Personnel**: Enseignants, Staff
- 📊 **Évaluations**: Configuration Notation, Bulletins, Statistiques, Rapports
- 💬 **Communication**: Messages, Annonces
- 💰 **Finance**: Finance & Scolarité, Prix & Bourses, Templates de Reçu, Abonnement

### 9.3 Vue Jour Emploi du Temps ✅

| Fichier | Description |
|---------|-------------|
| `components/schedule/DaySelector.tsx` | Sélecteur de jour avec navigation semaine |
| `components/schedule/StudentScheduleView.tsx` | Vue emploi du temps avec sélecteur de jour intégré |
| `app/api/schedule/day/route.ts` | API pour récupérer l'emploi du temps d'un jour |
| `app/student/[schoolId]/schedule/page.tsx` | Page refactorisée avec vue jour dynamique |

**Fonctionnalité**: L'étudiant peut naviguer entre les jours de la semaine pour voir son emploi du temps, avec indicateurs visuels pour le jour actuel et les cours en cours.

### 9.4 Équipe Pédagogique ✅

| Fichier | Description |
|---------|-------------|
| `app/student/[schoolId]/teachers/page.tsx` | Page listant les enseignants de l'étudiant |
| `components/student-nav.tsx` | Lien ajouté dans la navigation |

**Fonctionnalité**: L'étudiant peut voir la liste de ses enseignants avec leurs modules, spécialités et coordonnées.

### 9.5 Carnet de Correspondance ✅

| Fichier | Description |
|---------|-------------|
| `app/parent/[schoolId]/correspondence/page.tsx` | Page carnet de correspondance parent |
| `components/correspondence/NewCorrespondenceDialog.tsx` | Dialog création nouvelle conversation |
| `app/api/correspondence/create/route.ts` | API création conversation parent-enseignant |
| `components/parent-nav.tsx` | Lien ajouté dans la navigation |

**Fonctionnalité**: Les parents peuvent échanger avec les enseignants de leurs enfants via un carnet de correspondance dédié, avec création de conversations et notifications.

### 9.6 Notes Barème Variable ✅

| Fichier | Description |
|---------|-------------|
| `app/api/teacher/evaluations/route.ts` | API modifiée pour accepter maxPoints |
| `components/teacher/grades-manager.tsx` | Sélecteur de barème ajouté (/5, /8, /10, /12, /15, /20, /40, /100) |

**Fonctionnalité**: L'enseignant peut choisir un barème différent lors de la création d'une évaluation (notes sur 5, 8, 10, 12, 15, 20, 40 ou 100 points).

### 9.7 Agenda Événements ✅

| Fichier | Description |
|---------|-------------|
| `app/api/calendar/events/route.ts` | API GET/POST pour les événements |
| `app/student/[schoolId]/calendar/page.tsx` | Page agenda étudiant |
| `components/student-nav.tsx` | Lien ajouté dans la navigation |

**Fonctionnalité**: Les étudiants peuvent voir les événements de l'école (examens, vacances, réunions, échéances) filtrés par leur rôle, niveau et filière.

### 9.8 RDV Parent-Prof ✅

| Fichier | Description |
|---------|-------------|
| `app/api/appointments/route.ts` | API GET/POST pour les RDV |
| `app/api/appointments/[id]/route.ts` | API PATCH/DELETE pour gérer un RDV |
| `app/parent/[schoolId]/appointments/page.tsx` | Page RDV parent |
| `components/appointments/NewAppointmentDialog.tsx` | Dialog demande de RDV |
| `components/appointments/AppointmentActions.tsx` | Actions confirmer/annuler |
| `components/parent-nav.tsx` | Lien ajouté dans la navigation |

**Fonctionnalité**: Les parents peuvent demander des RDV avec les enseignants de leurs enfants. L'enseignant reçoit une notification et peut confirmer/annuler.

---

## 🎉 Phase 2 Complète !

**Statut global Phase 2**: ✅ 8/8 fonctionnalités implémentées

| # | Fonctionnalité | Statut |
|---|---------------|--------|
| 1 | Devoirs "J'ai terminé" | ✅ |
| 2 | Menu accordéon sidebar | ✅ |
| 3 | Vue jour emploi du temps | ✅ |
| 4 | Équipe pédagogique | ✅ |
| 5 | Carnet de correspondance | ✅ |
| 6 | Notes barème variable | ✅ |
| 7 | Agenda événements | ✅ |
| 8 | RDV parent-prof | ✅ |
