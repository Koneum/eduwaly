# Guide d'Implémentation - Annonces + Email Étudiant

## 📋 Fonctionnalités à implémenter

### 1. Système d'Annonces
- Super Admin → Annonces globales (toutes écoles)
- Admin → Annonces pour profs/parents/étudiants

### 2. Génération Email Étudiant
- Format: `N.Prenom@nom-etablissement.com`

### 3. Envoi Credentials
- Bouton dans profil étudiant
- Email avec: Email + Code + Lien enrôlement

---

## 🔧 Étapes d'implémentation

### Étape 1: Schéma Prisma
Ajouter dans `prisma/schema.prisma` avant les enums:

```prisma
model Announcement {
  id                String          @id @default(cuid())
  schoolId          String?
  school            School?         @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  authorId          String
  authorName        String
  authorRole        UserRole
  
  title             String
  content           String
  priority          AnnouncementPriority @default(NORMAL)
  targetAudience    String[]
  
  isActive          Boolean         @default(true)
  publishedAt       DateTime        @default(now())
  expiresAt         DateTime?
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("announcements")
}

enum AnnouncementPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

Ajouter dans model School:
```prisma
announcements      Announcement[]
```

Puis: `npx prisma migrate dev --name add_announcements`

### Étape 2: Utilitaire Email
Créer `lib/email-utils.ts` - voir fichier séparé

### Étape 3: APIs
- `/api/super-admin/announcements` - CRUD complet
- `/api/admin/announcements` - CRUD pour école
- `/api/announcements` - GET pour tous
- `/api/admin/send-credentials` - POST envoi email

### Étape 4: Composants
- `AnnouncementsManager` - Gestion annonces
- `AnnouncementsList` - Affichage
- Bouton envoi credentials dans StudentsManager

### Étape 5: Pages
- `/super-admin/announcements`
- `/admin/[schoolId]/announcements`

---

## 📁 Fichiers à créer

1. `lib/email-utils.ts`
2. `app/api/super-admin/announcements/route.ts`
3. `app/api/admin/announcements/route.ts`
4. `app/api/announcements/route.ts`
5. `app/api/admin/send-credentials/route.ts`
6. `components/announcements/AnnouncementsManager.tsx`
7. `components/announcements/AnnouncementsList.tsx`
8. `app/super-admin/announcements/page.tsx`
9. `app/admin/[schoolId]/announcements/page.tsx`

---

## ⚡ Prochaine étape
Je vais créer chaque fichier individuellement pour optimiser les crédits.
