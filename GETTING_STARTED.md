# 🚀 Guide de Démarrage - Schooly

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL installé et en cours d'exécution
- npm ou yarn

## 🔧 Installation

### 1. Cloner le projet

```bash
cd "d:\react\UE-GI app\schooly"
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-tres-long-et-securise"

# Prisma (optionnel pour Accelerate)
# DIRECT_URL="postgresql://..."
```

**Exemple pour une base locale** :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/schooly?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="changez-moi-avec-une-chaine-aleatoire-tres-longue"
```

### 4. Générer une clé secrète NextAuth

```bash
# Générer une clé aléatoire
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copiez le résultat dans `NEXTAUTH_SECRET`.

### 5. Migrer la base de données

```bash
npx prisma migrate dev --name init
```

Cette commande va :
- Créer toutes les tables dans PostgreSQL
- Générer le Prisma Client dans `app/generated/prisma`

### 6. (Optionnel) Peupler la base avec des données de test

```bash
npx tsx prisma/seed.ts
```

## 🏃 Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur démarre sur [http://localhost:3000](http://localhost:3000)

## 👤 Comptes de Test (après seed)

### Super Admin
- **Email**: `admin@schooly.com`
- **Mot de passe**: `Admin123!`
- **Accès**: `/super-admin`

### Admin École (Université Test)
- **Email**: `admin@universite-test.com`
- **Mot de passe**: `Admin123!`
- **Accès**: `/admin/[schoolId]`

### Enseignant
- **Email**: `prof@universite-test.com`
- **Mot de passe**: `Prof123!`
- **Accès**: `/teacher/[schoolId]`

### Étudiant
- **Email**: `etudiant@universite-test.com`
- **Mot de passe**: `Student123!`
- **Accès**: `/student/[schoolId]`

### Parent
- **Email**: `parent@universite-test.com`
- **Mot de passe**: `Parent123!`
- **Accès**: `/parent/[schoolId]`

## 📁 Structure des Routes

### Authentification
- `/login` - Page de connexion
- `/register` - Inscription d'une nouvelle école
- `/enroll` - Enrôlement étudiant/parent

### Super Admin
- `/super-admin` - Dashboard global
- `/super-admin/schools` - Gestion des écoles
- `/super-admin/subscriptions` - Gestion des abonnements
- `/super-admin/issues` - Signalements
- `/super-admin/analytics` - Statistiques

### Admin École
- `/admin/[schoolId]` - Dashboard école
- `/admin/[schoolId]/students` - Gestion étudiants
- `/admin/[schoolId]/finance` - Gestion paiements
- `/admin/[schoolId]/finance-settings` - Configuration frais
- `/admin/[schoolId]/financial-overview` - Vue d'ensemble financière
- `/admin/[schoolId]/users` - Gestion utilisateurs
- `/admin/[schoolId]/settings` - Paramètres école
- `/admin/[schoolId]/subscription` - Abonnement
- `/admin/[schoolId]/filieres` - Gestion filières
- `/admin/[schoolId]/modules` - Gestion modules
- `/admin/[schoolId]/enseignants` - Gestion enseignants
- `/admin/[schoolId]/emploi` - Emplois du temps
- `/admin/[schoolId]/rooms` - Gestion salles (université)
- `/admin/[schoolId]/classes` - Gestion classes (lycée)

### Enseignant
- `/teacher/[schoolId]` - Dashboard enseignant
- `/teacher/[schoolId]/courses` - Mes cours
- `/teacher/[schoolId]/students` - Mes étudiants
- `/teacher/[schoolId]/grades` - Notes et absences
- `/teacher/[schoolId]/homework` - Devoirs
- `/teacher/[schoolId]/schedule` - Emploi du temps

### Étudiant
- `/student/[schoolId]` - Dashboard étudiant
- `/student/[schoolId]/schedule` - Emploi du temps
- `/student/[schoolId]/grades` - Mes notes
- `/student/[schoolId]/absences` - Mes absences
- `/student/[schoolId]/homework` - Mes devoirs
- `/student/[schoolId]/payments` - Mes paiements

### Parent
- `/parent/[schoolId]` - Dashboard parent
- `/parent/[schoolId]/children` - Mes enfants
- `/parent/[schoolId]/schedule` - Emplois du temps
- `/parent/[schoolId]/grades` - Notes des enfants
- `/parent/[schoolId]/payments` - Paiements
- `/parent/[schoolId]/messages` - Messagerie

## 🔑 APIs Principales

### Authentification
- `POST /api/auth/register` - Inscription école
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### School Admin
- `GET/POST/PUT/DELETE /api/school-admin/students` - Gestion étudiants
- `GET/POST/PUT/DELETE /api/school-admin/users` - Gestion utilisateurs
- `GET/POST/PUT/DELETE /api/school-admin/fee-structures` - Frais de scolarité
- `POST /api/school-admin/payments` - Enregistrer paiement
- `GET/POST/PUT/DELETE /api/school-admin/scholarships` - Bourses
- `GET/POST/PUT/DELETE /api/school-admin/rooms` - Salles
- `GET/PUT /api/school-admin/subscription` - Abonnement

### Super Admin
- `POST/DELETE /api/super-admin/schools` - Gestion écoles
- `PUT/DELETE /api/super-admin/subscriptions` - Gestion abonnements
- `GET/PUT/DELETE /api/super-admin/issues` - Signalements

### Données Académiques
- `GET/POST/PUT/DELETE /api/filieres` - Filières
- `GET/POST/PUT/DELETE /api/modules` - Modules
- `GET/POST/PUT/DELETE /api/enseignants` - Enseignants
- `GET/POST/PUT/DELETE /api/emploi` - Emplois du temps
- `GET/POST/PUT/DELETE /api/evaluations` - Notes
- `GET/POST/PUT/DELETE /api/absences` - Absences
- `GET/POST /api/homework` - Devoirs

## 🗄️ Modèles Prisma Principaux

- **School** - École/Organisation (tenant)
- **User** - Utilisateur (5 rôles)
- **Student** - Étudiant
- **Parent** - Parent
- **Enseignant** - Enseignant
- **Filiere** - Filière/Série
- **Module** - Module/Matière
- **EmploiDuTemps** - Emploi du temps
- **Evaluation** - Note
- **Absence** - Absence
- **Homework** - Devoir
- **Submission** - Soumission de devoir
- **FeeStructure** - Structure des frais
- **StudentPayment** - Paiement étudiant
- **Scholarship** - Bourse
- **Plan** - Plan d'abonnement
- **Subscription** - Abonnement école
- **IssueReport** - Signalement
- **Room** - Salle (université)
- **Class** - Classe (lycée)
- **Document** - Document/Ressource

## 🛠️ Commandes Utiles

### Prisma

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_migration

# Réinitialiser la base de données
npx prisma migrate reset

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Générer le client Prisma
npx prisma generate

# Formater le schema
npx prisma format
```

### Développement

```bash
# Démarrer en mode développement
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint
```

## 📦 Technologies Utilisées

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS 4, shadcn/ui
- **Base de données**: PostgreSQL + Prisma ORM 6.18
- **Authentification**: NextAuth.js v5
- **Composants**: Radix UI, Lucide Icons
- **PDF**: jsPDF, jsPDF-AutoTable
- **Dates**: date-fns
- **Validation**: Zod (implicite via Prisma)

## 🐛 Résolution de Problèmes

### Erreur "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### Erreur de connexion à la base de données

Vérifiez que :
1. PostgreSQL est démarré
2. Les credentials dans `.env` sont corrects
3. La base de données existe

```bash
# Créer la base de données si elle n'existe pas
psql -U postgres
CREATE DATABASE schooly;
\q
```

### Erreur "NEXTAUTH_SECRET is not set"

Générez et ajoutez une clé secrète dans `.env` :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Port 3000 déjà utilisé

```bash
# Utiliser un autre port
PORT=3001 npm run dev
```

## 📚 Documentation

- [Plan de Transformation SAAS](./SAAS_TRANSFORMATION_PLAN.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

## 🤝 Contribution

1. Créer une branche pour votre fonctionnalité
2. Faire vos modifications
3. Tester localement
4. Créer une Pull Request

## 📞 Support

Pour toute question ou problème, consultez le fichier `SAAS_TRANSFORMATION_PLAN.md` pour voir l'état d'avancement du projet.

---

**Version**: 1.0  
**Dernière mise à jour**: 30 octobre 2025
