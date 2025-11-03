# 📚 Documentation du Système d'Abonnement

## 🎯 Vue d'Ensemble

Le système d'abonnement permet de :
- Gérer 4 plans (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
- Vérifier les fonctionnalités disponibles (feature flags)
- Contrôler les limites (quotas)
- Afficher des avertissements quand les limites sont approchées

## 📦 Fichiers Créés

### Types et Configuration
- `types/subscription.ts` - Types TypeScript et configuration des plans
- `lib/subscription/features.ts` - Utilitaires de vérification

### Hooks et Composants
- `lib/subscription/useSubscription.ts` - Hook React pour accéder à l'abonnement
- `components/subscription/FeatureGate.tsx` - Composant pour bloquer/afficher selon feature
- `components/subscription/LimitWarning.tsx` - Afficher avertissements de limite
- `components/pricing/PricingSection.tsx` - Section de tarification
- `components/pricing/PlanSelector.tsx` - Sélecteur de plan

### Middleware et API
- `lib/subscription/middleware.ts` - Vérification des limites côté serveur
- `app/api/subscription/current/route.ts` - API pour récupérer l'abonnement

### Pages
- `app/pricing/page.tsx` - Page publique de tarification

## 🚀 Utilisation

### 1. Vérifier une Fonctionnalité (Feature Flag)

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

// Bloquer une fonctionnalité si non disponible
<FeatureGate feature="messaging_internal">
  <MessagingInterface />
</FeatureGate>

// Avec message personnalisé
<FeatureGate 
  feature="payments_online"
  fallback={<p>Paiement en ligne non disponible</p>}
>
  <OnlinePaymentForm />
</FeatureGate>
```

### 2. Vérifier dans le Code

```tsx
import { useSubscription } from '@/lib/subscription/useSubscription'

function MyComponent() {
  const { checkFeature } = useSubscription()
  
  if (checkFeature('homework_submissions')) {
    // Afficher le formulaire de soumission
  }
}
```

### 3. Afficher un Avertissement de Limite

```tsx
import { LimitWarning } from '@/components/subscription/LimitWarning'

<LimitWarning 
  limitType="maxStudents"
  currentValue={studentCount}
  schoolId={schoolId}
/>
```

### 4. Vérifier les Limites dans une API

```tsx
import { withLimitCheck } from '@/lib/subscription/middleware'

export async function POST(request: Request) {
  const { schoolId } = await request.json()
  
  return withLimitCheck(schoolId, 'maxStudents', async () => {
    // Créer l'étudiant
    const student = await prisma.student.create({...})
    return NextResponse.json(student)
  })
}
```

### 5. Vérification Manuelle

```tsx
import { checkSchoolLimit } from '@/lib/subscription/middleware'

const check = await checkSchoolLimit(schoolId, 'maxTeachers')

if (!check.allowed) {
  return NextResponse.json(
    { error: check.message },
    { status: 403 }
  )
}
```

## 📋 Liste des Features Disponibles

### Communication
- `messaging_internal` - Messagerie interne
- `notifications_email` - Notifications par email
- `notifications_sms` - Notifications par SMS
- `announcements` - Système d'annonces

### Académique
- `homework_assignments` - Création de devoirs
- `homework_submissions` - Soumission de devoirs
- `evaluations_individual` - Évaluations individuelles
- `evaluations_group` - Évaluations de groupe
- `attendance_basic` - Présences basiques
- `attendance_advanced` - Présences avancées
- `grade_reports_basic` - Bulletins basiques
- `grade_reports_advanced` - Bulletins avancés

### Documents
- `documents_pdf_only` - Documents PDF uniquement
- `documents_all_types` - Tous types de documents
- `documents_videos` - Upload de vidéos
- `documents_library` - Bibliothèque de documents

### Finance
- `payments_manual` - Paiements manuels
- `payments_online` - Paiements en ligne
- `payments_reminders_email` - Rappels par email
- `payments_reminders_sms` - Rappels par SMS
- `scholarships` - Gestion des bourses
- `financial_reports_basic` - Rapports financiers basiques
- `financial_reports_advanced` - Rapports financiers avancés

### Rapports
- `reports_csv_export` - Export CSV
- `reports_pdf_basic` - Rapports PDF basiques
- `reports_pdf_advanced` - Rapports PDF avancés
- `reports_statistics` - Rapports statistiques
- `reports_predictive` - Rapports prédictifs

### Système
- `permissions_system` - Système de permissions
- `multi_campus` - Multi-campus
- `api_access` - Accès API
- `webhooks` - Webhooks
- `custom_branding` - Branding personnalisé
- `sso` - Single Sign-On
- `two_factor_auth` - Authentification 2FA

## 📊 Limites Disponibles

- `maxStudents` - Nombre maximum d'étudiants
- `maxTeachers` - Nombre maximum d'enseignants
- `maxAdminStaff` - Nombre maximum de personnel admin
- `maxClasses` - Nombre maximum de classes
- `maxModules` - Nombre maximum de modules
- `maxRooms` - Nombre maximum de salles
- `storageGB` - Stockage en GB
- `emailsPerMonth` - Emails par mois
- `smsPerMonth` - SMS par mois
- `maxCampus` - Nombre maximum de campus

## ✅ Prochaines Étapes

1. Intégrer `FeatureGate` dans les pages existantes
2. Ajouter `LimitWarning` dans les managers
3. Utiliser `withLimitCheck` dans les APIs de création
4. Tester le système complet
5. Intégrer Stripe pour les paiements

## 📝 Notes

- Les valeurs `-1` dans les limites signifient "illimité"
- Le plan TRIAL donne accès au plan PROFESSIONAL pendant 30 jours
- Les feature flags sont vérifiés côté client ET serveur
