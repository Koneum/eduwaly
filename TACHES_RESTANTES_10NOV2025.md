# 📋 TÂCHES RESTANTES - 10 Novembre 2025 (22h30)

## 🎯 DEMANDES UTILISATEUR

### **1. Templates PDF avec Logo, Adresse, Email, Téléphone, Tampon** ✅ (En cours)

**Statut**: 80% Complété

**Ce qui est fait**:
- ✅ Modèle `PDFTemplate` ajouté dans `schema.prisma`
- ✅ API `/api/admin/pdf-templates` corrigée (GET + POST avec upsert)
- ✅ Composant `pdf-template-editor.tsx` mis à jour avec `showStamp`
- ✅ Relation `pdfTemplate` ajoutée dans modèle `School`

**Ce qui reste**:
1. ⏳ **Générer le client Prisma**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. ⏳ **Utiliser le template dans les exports PDF**
   - Modifier `finance-manager.tsx` (export PDF)
   - Modifier `students-manager.tsx` (si export PDF)
   - Modifier `AdvancedReportsManager.tsx` (export PDF)
   - Modifier `/api/admin/bulletins/generate/route.ts`
   
3. ⏳ **Créer fonction utilitaire `generatePDFHeader()`**
   ```typescript
   // lib/pdf-utils.ts
   export function generatePDFHeader(school, template) {
     return `
       <div class="header">
         ${template.showLogo && school.logo ? `<img src="${school.logo}" />` : ''}
         <h1 style="font-size: ${template.schoolNameSize}px; color: ${template.headerColor}">
           ${school.name}
         </h1>
         ${template.showAddress && school.address ? `<p>${school.address}</p>` : ''}
         ${template.showPhone && school.phone ? `<p>Tel: ${school.phone}</p>` : ''}
         ${template.showEmail && school.email ? `<p>Email: ${school.email}</p>` : ''}
         ${template.showStamp && school.stamp ? `<img src="${school.stamp}" class="stamp" />` : ''}
       </div>
     `
   }
   ```

---

### **2. Gestion Abonnements par Super Admin** ⏳ (À faire)

**Objectif**: Super Admin doit pouvoir gérer tous les abonnements des écoles

**Fonctionnalités requises**:
1. **Page Super Admin - Gestion Abonnements**
   - Liste de toutes les écoles avec leur abonnement
   - Filtres: Actif, Expiré, En pause, Annulé
   - Recherche par nom d'école

2. **Actions disponibles**:
   - ✅ **Accorder** un abonnement (plan + durée)
   - ✅ **Renouveler** manuellement (prolonger la date d'expiration)
   - ✅ **Mettre en pause** (suspendre temporairement)
   - ✅ **Supprimer** (annuler définitivement)
   - ✅ **Modifier le plan** (upgrade/downgrade)

3. **Fichiers à créer/modifier**:
   - `app/super-admin/subscriptions/page.tsx` (nouvelle page)
   - `components/super-admin/subscriptions-manager.tsx` (nouveau composant)
   - `app/api/super-admin/subscriptions/[id]/route.ts` (nouvelle API)

**Schéma de données** (déjà existant):
```prisma
model Subscription {
  id              String            @id @default(cuid())
  schoolId        String            @unique
  school          School            @relation(fields: [schoolId], references: [id])
  plan            SubscriptionPlan  // STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
  status          SubscriptionStatus // ACTIVE, PAUSED, CANCELLED, EXPIRED
  startDate       DateTime
  endDate         DateTime
  autoRenew       Boolean           @default(false)
  paymentMethod   String?
  lastPaymentDate DateTime?
  nextPaymentDate DateTime?
  
  // Limites selon le plan
  maxStudents     Int
  maxTeachers     Int
  features        Json              // Fonctionnalités activées
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
```

**Actions Super Admin**:
```typescript
// 1. Accorder un abonnement
POST /api/super-admin/subscriptions
{
  schoolId: string
  plan: "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE"
  duration: number // mois
  features?: string[] // pour Enterprise custom
}

// 2. Renouveler
PATCH /api/super-admin/subscriptions/[id]/renew
{
  duration: number // mois à ajouter
}

// 3. Mettre en pause
PATCH /api/super-admin/subscriptions/[id]/pause

// 4. Réactiver
PATCH /api/super-admin/subscriptions/[id]/resume

// 5. Supprimer
DELETE /api/super-admin/subscriptions/[id]

// 6. Modifier le plan
PATCH /api/super-admin/subscriptions/[id]/change-plan
{
  newPlan: string
  features?: string[] // pour Enterprise
}
```

---

### **3. Pack Enterprise Custom** ⏳ (À faire)

**Objectif**: Super Admin peut personnaliser les fonctionnalités du pack Enterprise

**Fonctionnalités requises**:
1. **Liste des fonctionnalités disponibles**
   ```typescript
   const AVAILABLE_FEATURES = [
     // Basiques (incluses dans tous les plans)
     { id: 'students_management', name: 'Gestion étudiants', category: 'basic' },
     { id: 'teachers_management', name: 'Gestion enseignants', category: 'basic' },
     { id: 'attendance', name: 'Gestion présences', category: 'basic' },
     { id: 'grades', name: 'Gestion notes', category: 'basic' },
     { id: 'bulletins_basic', name: 'Bulletins PDF basiques', category: 'basic' },
     
     // Professionnelles (PROFESSIONAL+)
     { id: 'messaging', name: 'Messagerie interne', category: 'professional' },
     { id: 'homework', name: 'Devoirs et soumissions', category: 'professional' },
     { id: 'email_notifications', name: 'Notifications email', category: 'professional', limit: 500 },
     { id: 'advanced_reports', name: 'Rapports avancés', category: 'professional' },
     { id: 'storage_50gb', name: 'Stockage 50 GB', category: 'professional' },
     
     // Business (BUSINESS+)
     { id: 'online_payment', name: 'Paiement en ligne (Stripe)', category: 'business' },
     { id: 'multi_campus', name: 'Multi-campus (5 max)', category: 'business' },
     { id: 'sms_notifications', name: 'Notifications SMS', category: 'business', limit: 1000 },
     { id: 'api_webhooks', name: 'API et webhooks', category: 'business' },
     { id: 'storage_200gb', name: 'Stockage 200 GB', category: 'business' },
     
     // Enterprise (ENTERPRISE)
     { id: 'unlimited_students', name: 'Étudiants illimités', category: 'enterprise' },
     { id: 'unlimited_teachers', name: 'Enseignants illimités', category: 'enterprise' },
     { id: 'dedicated_infrastructure', name: 'Infrastructure dédiée', category: 'enterprise' },
     { id: 'custom_branding', name: 'Branding personnalisé', category: 'enterprise' },
     { id: 'sso_2fa', name: 'SSO et 2FA', category: 'enterprise' },
     { id: 'sla_99_9', name: 'SLA 99.9%', category: 'enterprise' },
     { id: 'support_24_7', name: 'Support 24/7 dédié', category: 'enterprise' },
     { id: 'custom_features', name: 'Fonctionnalités sur mesure', category: 'enterprise' },
   ]
   ```

2. **Interface Super Admin - Configuration Enterprise**
   - Sélectionner les fonctionnalités à activer
   - Définir les limites personnalisées (étudiants, enseignants, stockage, etc.)
   - Définir le prix personnalisé
   - Sauvegarder la configuration

3. **Fichiers à créer/modifier**:
   - `components/super-admin/enterprise-config.tsx` (nouveau)
   - `app/api/super-admin/enterprise-features/route.ts` (nouveau)
   - Mettre à jour `PricingSection.tsx` pour afficher "Custom" si Enterprise
   - Mettre à jour `PlanSelector.tsx` pour gérer Enterprise custom

**Stockage des features**:
```typescript
// Dans Subscription.features (JSON)
{
  "students_management": { enabled: true },
  "teachers_management": { enabled: true },
  "messaging": { enabled: true },
  "email_notifications": { enabled: true, limit: 500 },
  "sms_notifications": { enabled: true, limit: 1000 },
  "storage": { enabled: true, limit: "200GB" },
  "custom_features": { enabled: true, description: "Intégration ERP personnalisée" }
}
```

---

### **4. Mise à jour PricingSection.tsx** ⏳ (À faire)

**Modifications requises**:
1. Mettre à jour la liste des fonctionnalités de chaque plan
2. Ajouter plus de détails pour Enterprise
3. Afficher "Custom" si Enterprise avec config personnalisée

**Nouveau format**:
```typescript
{
  name: "ENTERPRISE",
  displayName: "Enterprise",
  price: "Sur devis",
  currency: "",
  period: "",
  description: "Pour les réseaux d'établissements.",
  features: [
    "Étudiants illimités",
    "Enseignants illimités",
    "Toutes les fonctionnalités Business",
    "Infrastructure dédiée",
    "Branding personnalisé (logo, couleurs, domaine)",
    "SSO (SAML, OAuth) et 2FA",
    "SLA 99.9% garanti",
    "Support 24/7 dédié avec account manager",
    "API complète et webhooks",
    "Intégrations personnalisées (ERP, CRM, etc.)",
    "Formation sur site",
    "Stockage illimité",
    "Fonctionnalités sur mesure",
  ],
  cta: "Nous contacter",
  highlighted: false,
  custom: true, // Nouveau champ
}
```

---

## 📊 RÉSUMÉ DES TÂCHES

### **Priorité 1: Templates PDF** (2h)
1. ✅ Schéma Prisma modifié
2. ✅ API corrigée
3. ✅ Composant éditeur mis à jour
4. ⏳ Générer client Prisma
5. ⏳ Créer fonction utilitaire `generatePDFHeader()`
6. ⏳ Intégrer dans tous les exports PDF:
   - finance-manager.tsx
   - AdvancedReportsManager.tsx
   - bulletins-generator.tsx (API)

### **Priorité 2: Gestion Abonnements Super Admin** (3-4h)
1. ⏳ Créer page `/super-admin/subscriptions`
2. ⏳ Créer composant `subscriptions-manager.tsx`
3. ⏳ Créer APIs:
   - GET /api/super-admin/subscriptions (liste)
   - POST /api/super-admin/subscriptions (créer)
   - PATCH /api/super-admin/subscriptions/[id]/renew
   - PATCH /api/super-admin/subscriptions/[id]/pause
   - PATCH /api/super-admin/subscriptions/[id]/resume
   - DELETE /api/super-admin/subscriptions/[id]
   - PATCH /api/super-admin/subscriptions/[id]/change-plan
4. ⏳ Ajouter dans navigation Super Admin

### **Priorité 3: Pack Enterprise Custom** (2-3h)
1. ⏳ Créer composant `enterprise-config.tsx`
2. ⏳ Créer API `/api/super-admin/enterprise-features`
3. ⏳ Mettre à jour `PricingSection.tsx`
4. ⏳ Mettre à jour `PlanSelector.tsx`
5. ⏳ Ajouter validation des features dans middleware

---

## 🚀 COMMANDES À EXÉCUTER

### **1. Générer le client Prisma**
```bash
# Générer le client avec le nouveau modèle PDFTemplate
npx prisma generate

# Pousser les changements vers la base de données
npx prisma db push
```

### **2. Redémarrer le serveur**
```bash
# Arrêter avec Ctrl+C
npm run dev
```

---

## 📝 NOTES IMPORTANTES

### **Templates PDF**
- Le champ `stamp` existe déjà dans `School` (ligne 151 du schema)
- Tous les exports PDF doivent utiliser la fonction utilitaire
- Le template est unique par école (`schoolId @unique`)

### **Abonnements**
- Le modèle `Subscription` existe déjà
- Les enums `SubscriptionPlan` et `SubscriptionStatus` existent
- Ajouter middleware pour vérifier les features activées

### **Enterprise Custom**
- Stocker les features dans le champ JSON `features`
- Permettre limites personnalisées (étudiants, enseignants, stockage)
- Super Admin seul peut modifier

---

## ✅ CHECKLIST AVANT TESTS

- [ ] `npx prisma generate` exécuté
- [ ] `npx prisma db push` exécuté
- [ ] Serveur redémarré
- [ ] Tester sauvegarde template PDF
- [ ] Tester export PDF avec logo/tampon
- [ ] Tester gestion abonnements Super Admin
- [ ] Tester configuration Enterprise custom

---

**TEMPS ESTIMÉ TOTAL**: 7-9 heures

**PROCHAINE SESSION**: Commencer par générer Prisma et intégrer les templates dans les exports PDF
