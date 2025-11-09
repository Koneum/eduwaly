# 📦 Installation des Dépendances Manquantes

## 🎯 Dépendances à Installer

### 1. Vaul (Pour les Drawers Mobile)

```bash
npm install vaul
# ou
yarn add vaul
# ou
pnpm add vaul
```

**Utilisation**: Composant Drawer pour la navigation mobile et les dialogues responsive.

### 2. Resend (Notifications Email - Optionnel)

```bash
npm install resend
```

**Configuration**: Ajouter dans `.env`:
```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@votredomaine.com
```

### 3. AWS SDK (Upload Fichiers S3 - Optionnel)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Configuration**: Ajouter dans `.env`:
```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 4. Stripe (Paiements - Optionnel)

```bash
npm install stripe @stripe/stripe-js
```

**Configuration**: Ajouter dans `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## ✅ Commande d'Installation Complète

```bash
# Dépendances CRITIQUES
npm install vaul

# Dépendances OPTIONNELLES (selon besoins)
npm install resend @aws-sdk/client-s3 @aws-sdk/s3-request-presigner stripe @stripe/stripe-js
```

---

## 🔧 Vérification Post-Installation

### 1. Vérifier package.json

```json
{
  "dependencies": {
    "vaul": "^0.9.0",
    "resend": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "stripe": "^14.0.0",
    // ... autres dépendances
  }
}
```

### 2. Tester les Composants

```tsx
// Test du Drawer
import { Drawer } from "@/components/ui/drawer"

// Test du ResponsiveDialog
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

// Test de MobileNav
import { MobileNav } from "@/components/mobile-nav"
```

### 3. Vérifier les Imports

Aucune erreur TypeScript ne devrait apparaître après installation.

---

## 🐛 Résolution de Problèmes

### Erreur: Cannot find module 'vaul'

**Solution**:
```bash
npm install vaul
npm run dev
```

### Erreur: Module not found @aws-sdk

**Solution**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Erreur TypeScript après installation

**Solution**:
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Notes

- **Vaul** est REQUIS pour le responsive design
- **Resend, AWS, Stripe** sont optionnels selon les fonctionnalités activées
- Toujours redémarrer le serveur de dev après installation

---

## 🚀 Prochaines Étapes

Après installation:
1. ✅ Vérifier absence d'erreurs TypeScript
2. ✅ Tester les composants mobile
3. ✅ Configurer les variables d'environnement
4. ✅ Procéder à l'optimisation responsive
