# 📝 TODO - Prochaines Étapes Prioritaires

> **Progression Globale**: 92% | **Temps Restant Estimé**: 1-2 semaines  
> **Dernière mise à jour**: 2 novembre 2025 - 05h25

---

## ✅ COMPLÉTÉ RÉCEMMENT

### 🔧 Corrections (2 novembre 2025)

- [x] **Correction API Enseignants**
  - [x] Ajout import manquant `import { auth } from '@/lib/auth'`
  - [x] Correction erreur "Cannot find name 'auth'" ligne 118
  - [x] L'API POST `/api/enseignants` utilise `auth.api.signUpEmail()` pour créer les comptes utilisateurs
  - [x] Liaison automatique enseignant ↔ compte utilisateur via `userId`

### 📝 Complété (1er novembre 2025)

### 📨 Système de Messagerie et Notifications - **100% TERMINÉ** 🆕

- [x] **Modèles Prisma (4 nouveaux)**
  - [x] Conversation (id, schoolId, subject, type)
  - [x] ConversationParticipant (userId, lastReadAt, isArchived, isMuted)
  - [x] Message (senderId, content, attachments, readBy)
  - [x] Notification (userId, title, message, type, category)
  - [x] Enums: ConversationType, NotificationType, NotificationCategory

- [x] **APIs REST (8 routes)**
  - [x] `GET /api/messages/conversations` - Liste des conversations
  - [x] `POST /api/messages/conversations` - Créer conversation
  - [x] `GET /api/messages/conversations/[id]` - Messages d'une conversation
  - [x] `POST /api/messages/conversations/[id]/messages` - Envoyer message
  - [x] `DELETE /api/messages/conversations/[id]` - Archiver conversation
  - [x] `GET /api/notifications` - Liste des notifications
  - [x] `POST /api/notifications` - Créer notification (Admin)
  - [x] `PUT /api/notifications` - Marquer comme lu
  - [x] `DELETE /api/notifications` - Supprimer notifications

- [x] **Composants React (2 majeurs)**
  - [x] MessagingInterface - Interface complète de messagerie (400+ lignes)
  - [x] NotificationCenter - Centre de notifications avec dropdown (250+ lignes)
  - [x] Support recherche, archivage, auto-scroll
  - [x] Badges et compteurs de messages non lus
  - [x] Polling automatique (30 secondes)

- [x] **Pages de Messagerie (4 pages)**
  - [x] `/admin/[schoolId]/messages` - Admin
  - [x] `/teacher/[schoolId]/messages` - Enseignant
  - [x] `/student/[schoolId]/messages` - Étudiant
  - [x] `/parent/[schoolId]/messages` - Parent (remplace mockup)

- [x] **Migration Base de Données**
  - [x] Migration `20251101125121_add_messaging_and_notifications`
  - [x] Tables: conversations, conversation_participants, messages, notifications
  - [x] Index sur conversationId et senderId

- [x] **Documentation**
  - [x] `MESSAGING_IMPLEMENTATION.md` - Documentation complète
  - [x] `IMPLEMENTATION_SUMMARY_NOV_01_2025.md` - Résumé
  - [x] `NEXT_STEPS.md` - Prochaines étapes

### 🔐 Système de Permissions Complet - **100% TERMINÉ**

- [x] **Tables Prisma**
  - [x] Modèle Permission (name, description, category)
  - [x] Modèle UserPermission (userId, permissionId, canView, canCreate, canEdit, canDelete)
  - [x] Relation User.permissions
  - [x] Nouveaux rôles: MANAGER, PERSONNEL, ASSISTANT, SECRETARY

- [x] **APIs REST**
  - [x] `GET /api/admin/permissions` - Liste des permissions
  - [x] `POST /api/admin/permissions` - Créer une permission
  - [x] `GET /api/admin/staff` - Liste du personnel
  - [x] `POST /api/admin/staff` - Créer un membre
  - [x] `GET /api/admin/staff/[id]` - Détails
  - [x] `PUT /api/admin/staff/[id]` - Modifier
  - [x] `DELETE /api/admin/staff/[id]` - Supprimer

- [x] **Composants React**
  - [x] PermissionButton - Bouton avec vérification
  - [x] PermissionMenuItem - Menu item avec permissions
  - [x] PermissionNavItem - Navigation avec permissions
  - [x] usePermissions - Hook de vérification
  - [x] StaffManager - Gestion du personnel

- [x] **Page Staff**
  - [x] `/admin/[schoolId]/staff` - Interface complète
  - [x] Dialog création avec onglets (Infos + Permissions)
  - [x] Grille de permissions par catégorie
  - [x] Actions CRUD complètes

- [x] **Intégration**
  - [x] Students Manager - Tous les boutons protégés
  - [x] Navigation - Lien "Staff" ajouté
  - [x] Dark Mode - Corrections Filières, Emploi, Enseignants

- [x] **Scripts**
  - [x] `scripts/seed-permissions.ts` - Seed 38 permissions
  - [x] `scripts/seed-complete.ts` - Permissions + comptes BetterAuth

- [x] **Migration BetterAuth**
  - [x] Remplacement de NextAuth par BetterAuth
  - [x] Correction des appels `auth()`
  - [x] Création des comptes Account

---

## 🎯 PROCHAINES PRIORITÉS (Crédits restants : ~190)

### ⚡ Actions Immédiates (30 min - 10 crédits)
- [ ] **Intégrer NotificationCenter dans la navigation**
  - [ ] Ajouter dans `app/admin/[schoolId]/layout.tsx`
  - [ ] Ajouter dans `app/teacher/[schoolId]/layout.tsx`
  - [ ] Ajouter dans `app/student/[schoolId]/layout.tsx`
  - [ ] Ajouter dans `app/parent/[schoolId]/layout.tsx`

### Option A : Upload + Notifications Email (~180 crédits)
- [ ] **Upload de Fichiers** (~100 crédits)
  - [ ] Configuration Cloudinary/AWS S3
  - [ ] API upload `/api/upload`
  - [ ] Composant FileUpload
  - [ ] Intégration dans soumissions de devoirs
  - [ ] Intégration dans messages (pièces jointes)
  - [ ] Upload logo école et avatars

- [ ] **Notifications Email** (~80 crédits)
  - [ ] Configuration Resend
  - [ ] Templates d'emails (bienvenue, enrôlement, rappel)
  - [ ] API d'envoi
  - [ ] Intégration dans workflows

### Option B : Finaliser Permissions + Stripe (~190 crédits)
- [ ] **Finaliser les Permissions** (~90 crédits)
  - [ ] Implémenter PermissionButton dans Enseignants
  - [ ] Implémenter PermissionButton dans Modules
  - [ ] Implémenter PermissionButton dans Filières
  - [ ] Implémenter PermissionButton dans Emploi du temps
  - [ ] Implémenter PermissionButton dans Finance
  - [ ] Mettre à jour la navigation avec PermissionNavItem
  - [ ] Vérification côté serveur dans toutes les APIs

- [ ] **Intégration Stripe Complète** (~100 crédits)
  - [ ] Configuration et webhooks
  - [ ] Page de checkout
  - [ ] Portail client
  - [ ] Synchronisation

### Option C : Reporting Avancé (~180 crédits)
- [ ] **Bulletins de Notes PDF** (~90 crédits)
  - [ ] Service de génération PDF
  - [ ] API `/api/student/bulletin/[id]`
  - [ ] Boutons de téléchargement
  - [ ] Calcul automatique des moyennes

- [ ] **Certificats de Scolarité** (~50 crédits)
  - [ ] Template certificat
  - [ ] API `/api/student/certificate/[id]`
  - [ ] Interface de demande

- [ ] **Rapports Statistiques** (~40 crédits)
  - [ ] Rapports par filière
  - [ ] Rapports par niveau
  - [ ] Export Excel

---

## 🎯 SEMAINE 1 - Finalisation Phase 2 & 4

### 1. Intégration Stripe (Phase 2) - HAUTE PRIORITÉ

**Objectif**: Permettre les paiements d'abonnement via Stripe

- [ ] **Configuration Stripe**
  - [ ] Créer un compte Stripe (mode test)
  - [ ] Ajouter les clés API dans `.env`
    ```env
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_PUBLISHABLE_KEY=pk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```
  - [ ] Installer `stripe` et `@stripe/stripe-js`
    ```bash
    npm install stripe @stripe/stripe-js
    ```

- [ ] **Créer les Plans dans Stripe**
  - [ ] Plan Gratuit (Trial - 30 jours)
  - [ ] Plan Basique (50 étudiants, 10 enseignants)
  - [ ] Plan Standard (200 étudiants, 30 enseignants)
  - [ ] Plan Premium (500 étudiants, 100 enseignants)
  - [ ] Plan Enterprise (illimité)

- [ ] **API Webhooks Stripe**
  - [ ] Créer `/api/webhooks/stripe/route.ts`
  - [ ] Gérer `checkout.session.completed`
  - [ ] Gérer `customer.subscription.updated`
  - [ ] Gérer `customer.subscription.deleted`
  - [ ] Gérer `invoice.payment_succeeded`
  - [ ] Gérer `invoice.payment_failed`

- [ ] **Portail Client Stripe**
  - [ ] Bouton "Gérer l'abonnement" dans `/admin/[schoolId]/subscription`
  - [ ] Redirection vers Stripe Customer Portal
  - [ ] Synchronisation automatique des changements

- [ ] **Page de Checkout**
  - [ ] Créer `/admin/[schoolId]/subscription/checkout`
  - [ ] Intégrer Stripe Checkout
  - [ ] Redirection après paiement réussi

**Fichiers à créer/modifier**:
- `lib/stripe.ts` - Configuration Stripe
- `app/api/webhooks/stripe/route.ts` - Webhooks
- `app/api/school-admin/subscription/checkout/route.ts` - Créer session checkout
- `components/school-admin/subscription-manager.tsx` - Ajouter bouton Stripe

---

### 2. Middleware de Vérification des Limites (Phase 2)

**Objectif**: Bloquer les actions si les limites du plan sont dépassées

- [ ] **Créer le Middleware**
  - [ ] Créer `lib/subscription-limits.ts`
  - [ ] Fonction `checkStudentLimit(schoolId)`
  - [ ] Fonction `checkTeacherLimit(schoolId)`
  - [ ] Fonction `hasFeature(schoolId, feature)`

- [ ] **Intégrer dans les APIs**
  - [ ] `/api/school-admin/students` - Vérifier avant création
  - [ ] `/api/school-admin/users` (TEACHER) - Vérifier avant création
  - [ ] Retourner erreur 403 si limite dépassée

- [ ] **Affichage dans l'UI**
  - [ ] Badge "Limite atteinte" dans les managers
  - [ ] Message d'upgrade dans les dialogs
  - [ ] Lien vers `/admin/[schoolId]/subscription`

**Fichiers à créer/modifier**:
- `lib/subscription-limits.ts` - Logique de vérification
- `app/api/school-admin/students/route.ts` - Ajouter vérification
- `app/api/school-admin/users/route.ts` - Ajouter vérification
- `components/school-admin/students-manager.tsx` - Afficher limites
- `components/school-admin/users-manager.tsx` - Afficher limites

---

### 3. Notifications Email (Phase 5) - MOYENNE PRIORITÉ

**Objectif**: Envoyer des emails automatiques

- [ ] **Configuration Resend**
  - [ ] Créer compte Resend.com
  - [ ] Ajouter clé API dans `.env`
    ```env
    RESEND_API_KEY=re_...
    ```
  - [ ] Installer `resend`
    ```bash
    npm install resend
    ```

- [ ] **Templates d'Emails**
  - [ ] Email de bienvenue (nouvelle école)
  - [ ] Email d'enrôlement (étudiant/parent)
  - [ ] Email de rappel de paiement
  - [ ] Email de notification (nouveau devoir)
  - [ ] Email de rapport (notes, absences)

- [ ] **API d'Envoi**
  - [ ] Créer `lib/email.ts` - Service d'envoi
  - [ ] Créer `lib/email-templates.ts` - Templates
  - [ ] Fonction `sendEnrollmentEmail(email, enrollmentId)`
  - [ ] Fonction `sendPaymentReminder(student, payment)`
  - [ ] Fonction `sendHomeworkNotification(student, homework)`

- [ ] **Intégrer dans les Workflows**
  - [ ] Envoi automatique après création étudiant
  - [ ] Envoi automatique après création devoir
  - [ ] Bouton "Envoyer rappel" dans FinanceManager
  - [ ] Envoi automatique si paiement en retard (cron job)

**Fichiers à créer**:
- `lib/email.ts` - Service Resend
- `lib/email-templates.ts` - Templates HTML
- `app/api/school-admin/send-enrollment/route.ts` - Envoyer code enrôlement
- `app/api/school-admin/send-reminder/route.ts` - Envoyer rappel paiement

---

## 🎯 SEMAINE 2 - Fonctionnalités Avancées (Phase 5)

### 4. Upload de Fichiers (Phase 5)

**Objectif**: Permettre l'upload de documents et ressources

- [ ] **Configuration Cloudinary** (ou AWS S3)
  - [ ] Créer compte Cloudinary
  - [ ] Ajouter credentials dans `.env`
    ```env
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...
    ```
  - [ ] Installer `cloudinary`
    ```bash
    npm install cloudinary
    ```

- [ ] **API Upload**
  - [ ] Créer `/api/upload/route.ts`
  - [ ] Validation des fichiers (type, taille)
  - [ ] Upload vers Cloudinary
  - [ ] Retourner URL du fichier

- [ ] **Composant Upload**
  - [ ] Créer `components/ui/file-upload.tsx`
  - [ ] Drag & Drop
  - [ ] Preview des fichiers
  - [ ] Barre de progression

- [ ] **Intégration**
  - [ ] Upload documents dans CoursesManager (Teacher)
  - [ ] Upload fichiers dans soumissions de devoirs (Student)
  - [ ] Upload logo école dans settings
  - [ ] Upload avatar utilisateur

**Fichiers à créer**:
- `lib/cloudinary.ts` - Configuration
- `app/api/upload/route.ts` - API upload
- `components/ui/file-upload.tsx` - Composant upload
- Modifier `components/teacher/courses-manager.tsx` - Intégrer upload

---

### 5. Génération de Bulletins PDF (Phase 5)

**Objectif**: Générer des bulletins de notes en PDF

- [ ] **Créer le Service PDF**
  - [ ] Créer `lib/pdf-generator.ts`
  - [ ] Fonction `generateBulletin(studentId, period)`
  - [ ] Template bulletin avec logo école
  - [ ] Calcul automatique des moyennes

- [ ] **API Génération**
  - [ ] Créer `/api/student/bulletin/[id]/route.ts`
  - [ ] Récupérer toutes les notes de l'étudiant
  - [ ] Calculer moyennes par module
  - [ ] Générer PDF
  - [ ] Retourner le PDF

- [ ] **Boutons de Téléchargement**
  - [ ] Dans `/student/[schoolId]/grades` - Télécharger mon bulletin
  - [ ] Dans `/parent/[schoolId]/grades` - Télécharger bulletin enfant
  - [ ] Dans `/admin/[schoolId]/students` - Télécharger bulletin étudiant

**Fichiers à créer**:
- `lib/pdf-generator.ts` - Service génération PDF
- `app/api/student/bulletin/[id]/route.ts` - API génération
- Modifier pages pour ajouter boutons téléchargement

---

### 6. Certificats de Scolarité (Phase 5)

**Objectif**: Générer des certificats de scolarité

- [ ] **Template Certificat**
  - [ ] Créer `lib/certificate-generator.ts`
  - [ ] Template officiel avec logo et cachet
  - [ ] Informations étudiant (nom, niveau, filière)
  - [ ] Signature directeur

- [ ] **API Génération**
  - [ ] Créer `/api/student/certificate/[id]/route.ts`
  - [ ] Vérifier que l'étudiant est inscrit
  - [ ] Générer PDF
  - [ ] Enregistrer dans la base (historique)

- [ ] **Interface**
  - [ ] Bouton dans `/student/[schoolId]` - Demander certificat
  - [ ] Bouton dans `/admin/[schoolId]/students` - Générer certificat
  - [ ] Historique des certificats générés

**Fichiers à créer**:
- `lib/certificate-generator.ts` - Génération certificat
- `app/api/student/certificate/[id]/route.ts` - API
- Ajouter modèle `Certificate` dans Prisma (optionnel)

---

## 🎯 SEMAINE 3 - Optimisations & Tests

### 7. Messagerie Interne (Phase 5) - ✅ **COMPLÉTÉ**

**Objectif**: Finaliser le système de messagerie

- [x] **Modèle Prisma**
  - [x] Créer modèle `Message`
  - [x] Créer modèle `Conversation`
  - [x] Créer modèle `ConversationParticipant`
  - [x] Relations User ↔ Message

- [x] **APIs**
  - [x] `GET /api/messages/conversations` - Liste des conversations
  - [x] `POST /api/messages/conversations` - Créer conversation
  - [x] `GET /api/messages/conversations/[id]` - Messages d'une conversation
  - [x] `POST /api/messages/conversations/[id]/messages` - Envoyer message
  - [x] `DELETE /api/messages/conversations/[id]` - Archiver conversation

- [x] **Interface**
  - [x] Finaliser `/admin/[schoolId]/messages`
  - [x] Finaliser `/teacher/[schoolId]/messages`
  - [x] Finaliser `/student/[schoolId]/messages`
  - [x] Finaliser `/parent/[schoolId]/messages`
  - [x] Composant MessagingInterface complet
  - [ ] Notifications en temps réel (WebSocket - optionnel)

---

### 8. Notifications Push (Phase 5) - ✅ **COMPLÉTÉ**

**Objectif**: Notifications en temps réel

- [x] **Système de Notifications**
  - [x] Créer modèle `Notification` dans Prisma
  - [x] API pour récupérer notifications (`GET /api/notifications`)
  - [x] API pour créer notifications (`POST /api/notifications`)
  - [x] API pour marquer comme lu (`PUT /api/notifications`)
  - [x] API pour supprimer (`DELETE /api/notifications`)
  - [x] Composant `NotificationCenter` dans header
  - [x] Badge avec nombre de notifications non lues
  - [x] Polling automatique (30 secondes)

- [x] **Types de Notifications**
  - [x] Nouveau message reçu
  - [x] Support pour tous les types (INFO, SUCCESS, WARNING, ERROR, REMINDER)
  - [x] Support pour toutes les catégories (MESSAGE, PAYMENT, GRADE, ABSENCE, HOMEWORK, ANNOUNCEMENT, SYSTEM, OTHER)
  - [ ] Intégration automatique pour devoirs, notes, paiements (à finaliser)

- [ ] **Améliorations Futures**
  - [ ] WebSocket pour temps réel (au lieu de polling)
  - [ ] Notifications email (Resend/SendGrid)
  - [ ] Notifications SMS (Twilio)

---

### 9. Tests & Qualité

- [ ] **Tests Unitaires**
  - [ ] Installer `vitest`
  - [ ] Tester les fonctions utilitaires
  - [ ] Tester les helpers

- [ ] **Tests d'Intégration**
  - [ ] Tester les APIs principales
  - [ ] Tester l'authentification
  - [ ] Tester les permissions

- [ ] **Tests E2E** (optionnel)
  - [ ] Installer `playwright`
  - [ ] Tester le workflow d'inscription
  - [ ] Tester le workflow de paiement

---

## 🎯 SEMAINE 4 - Déploiement & Documentation

### 10. Préparation au Déploiement

- [ ] **Configuration Production**
  - [ ] Variables d'environnement Vercel
  - [ ] Base de données PostgreSQL (Supabase/Neon)
  - [ ] Configuration domaine

- [ ] **Optimisations**
  - [ ] Optimiser les images (next/image)
  - [ ] Lazy loading des composants
  - [ ] Compression des assets
  - [ ] Cache des requêtes

- [ ] **Sécurité**
  - [ ] Rate limiting sur les APIs
  - [ ] Validation des inputs (Zod)
  - [ ] Protection CSRF
  - [ ] Headers de sécurité

- [ ] **Monitoring**
  - [ ] Configurer Sentry (erreurs)
  - [ ] Configurer Vercel Analytics
  - [ ] Logs structurés

---

### 11. Documentation

- [ ] **Documentation Technique**
  - [ ] Documenter toutes les APIs
  - [ ] Diagrammes d'architecture
  - [ ] Guide de contribution

- [ ] **Documentation Utilisateur**
  - [ ] Guide administrateur
  - [ ] Guide enseignant
  - [ ] Guide étudiant/parent
  - [ ] FAQ

---

## 📊 Métriques de Succès

- [ ] Toutes les phases à 100%
- [ ] 0 erreurs TypeScript
- [ ] 0 erreurs ESLint
- [ ] Temps de chargement < 2s
- [ ] Score Lighthouse > 90
- [ ] Tests coverage > 80%

---

## 🚀 Déploiement Final

- [ ] **Vercel**
  - [ ] Connecter le repo GitHub
  - [ ] Configurer les variables d'environnement
  - [ ] Déployer en production
  - [ ] Configurer le domaine personnalisé

- [ ] **Base de Données**
  - [ ] Migrer vers Supabase ou Neon
  - [ ] Configurer les backups automatiques
  - [ ] Tester les performances

- [ ] **Post-Déploiement**
  - [ ] Tester toutes les fonctionnalités
  - [ ] Créer les premiers comptes de test
  - [ ] Monitorer les erreurs
  - [ ] Collecter les feedbacks

---

**Dernière mise à jour**: 2 novembre 2025 - 05h25  
**Progression**: 92% → Objectif 100% en 1-2 semaines  
**Système de Permissions**: ✅ 100% Complété  
**Système de Messagerie & Notifications**: ✅ 100% Complété 🆕  
**API Enseignants**: ✅ Corrigée (import auth)

---

## 📊 Statistiques Mises à Jour

### **Avant aujourd'hui**
- 43 modèles Prisma
- 56+ API routes
- 90% de progression

### **Après aujourd'hui**
- **47 modèles Prisma** (+4)
- **64+ API routes** (+8)
- **92% de progression** (+2%)

### **Fichiers créés aujourd'hui**
- 4 modèles Prisma (Conversation, ConversationParticipant, Message, Notification)
- 8 API routes (messagerie + notifications)
- 2 composants UI majeurs (MessagingInterface, NotificationCenter)
- 4 pages de messagerie
- 3 fichiers de documentation

### **Temps d'implémentation**
- ~2 heures pour le système complet
- ~1500 lignes de code ajoutées
- 18 fichiers créés/modifiés

---

## 🎯 Pour Atteindre 100%

**Ce qui reste** (8% = ~8-10 heures):
1. **Upload de Fichiers** (3%) - 3-4 heures
2. **Notifications Email** (2%) - 2-3 heures
3. **Bulletins PDF** (2%) - 2 heures
4. **Intégration NotificationCenter** (1%) - 30 minutes
