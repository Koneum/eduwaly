# 📊 Graphiques avec Données Réelles

## ✅ Composants Créés

### 1. **PaymentStatusChart V2**
**Fichier**: `components/payment-status-chart-v2.tsx`

**Fonctionnalités**:
- ✅ Récupère les données réelles depuis l'API
- ✅ Affiche 3 statuts: Payés, En attente, En retard
- ✅ Graphique en camembert (Pie Chart)
- ✅ Légende avec compteurs
- ✅ État de chargement
- ✅ Gestion du cas "aucune donnée"

**Props**:
```typescript
interface PaymentStatusChartProps {
  schoolId: string
}
```

**Utilisation**:
```tsx
<PaymentStatusChart schoolId={schoolId} />
```

---

### 2. **RevenueChart V2**
**Fichier**: `components/revenue-chart-v2.tsx`

**Fonctionnalités**:
- ✅ Récupère les revenus des 12 derniers mois
- ✅ Graphique en aire (Area Chart)
- ✅ Affiche le total des revenus
- ✅ Format FCFA
- ✅ État de chargement
- ✅ Gestion du cas "aucune donnée"

**Props**:
```typescript
interface RevenueChartProps {
  schoolId: string
}
```

**Utilisation**:
```tsx
<RevenueChart schoolId={schoolId} />
```

---

## 🔌 APIs Créées

### 1. **GET /api/school-admin/payments/stats**

**Paramètres**:
- `schoolId` (query string)

**Réponse**:
```json
{
  "paid": 45,
  "pending": 12,
  "overdue": 8
}
```

**Logique**:
- **Payés**: `status = 'PAID'`
- **En attente**: `status = 'PENDING'` ET `dueDate >= aujourd'hui`
- **En retard**: `status IN ('PENDING', 'PARTIAL')` ET `dueDate < aujourd'hui`

---

### 2. **GET /api/school-admin/payments/revenue**

**Paramètres**:
- `schoolId` (query string)

**Réponse**:
```json
[
  { "month": "Jan", "revenue": 45000 },
  { "month": "Fév", "revenue": 52000 },
  { "month": "Mar", "revenue": 48000 },
  ...
]
```

**Logique**:
- Récupère les paiements des 12 derniers mois
- Groupe par mois
- Somme les `amountPaid` par mois
- Retourne dans l'ordre chronologique

---

## 📝 Migration des Pages

### **Avant** (Anciennes versions avec données mockées)
```tsx
import { PaymentStatusChart } from "@/components/payment-status-chart"
import { RevenueChart } from "@/components/revenue-chart"

<PaymentStatusChart />
<RevenueChart />
```

### **Après** (Nouvelles versions avec données réelles)
```tsx
import { PaymentStatusChart } from "@/components/payment-status-chart-v2"
import { RevenueChart } from "@/components/revenue-chart-v2"

<PaymentStatusChart schoolId={schoolId} />
<RevenueChart schoolId={schoolId} />
```

---

## 🎯 Pages à Mettre à Jour

1. ✅ `app/admin/[schoolId]/page.tsx` - Dashboard admin
2. ✅ `app/super-admin/page.tsx` - Dashboard super admin
3. ✅ Toute autre page utilisant ces graphiques

---

## 📊 Exemple d'Intégration Complète

```tsx
// app/admin/[schoolId]/page.tsx
import { PaymentStatusChart } from "@/components/payment-status-chart-v2"
import { RevenueChart } from "@/components/revenue-chart-v2"

export default async function AdminDashboard({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tableau de Bord</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Graphique des revenus */}
        <RevenueChart schoolId={schoolId} />
        
        {/* Graphique des statuts de paiement */}
        <PaymentStatusChart schoolId={schoolId} />
      </div>
    </div>
  )
}
```

---

## 🔄 Différences Clés

| Aspect | Ancienne Version | Nouvelle Version |
|--------|------------------|------------------|
| **Données** | Mockées (statiques) | Réelles (dynamiques) |
| **Props** | Aucune ou optionnelles | `schoolId` requis |
| **Chargement** | Aucun | État de chargement |
| **Vide** | Données par défaut | Message "Aucune donnée" |
| **API** | Aucune | 2 endpoints dédiés |

---

## 🚀 Avantages

1. **Données en Temps Réel**: Les graphiques reflètent l'état actuel
2. **Multi-Tenant**: Chaque école voit ses propres données
3. **Performance**: Requêtes optimisées avec Prisma
4. **UX**: États de chargement et messages d'erreur
5. **Sécurité**: Vérification des permissions

---

## 📈 Métriques Calculées

### **Statut des Paiements**
- Compte le nombre de paiements par statut
- Exclut les paiements en retard des "en attente"
- Affiche le total

### **Revenus Mensuels**
- Somme des `amountPaid` par mois
- 12 derniers mois glissants
- Format: FCFA avec séparateurs de milliers
- Total affiché en haut à droite

---

## 🎨 Personnalisation

### **Couleurs**
```typescript
// PaymentStatusChart
{ name: "Payés", color: "hsl(142, 76%, 36%)" }      // Vert
{ name: "En attente", color: "hsl(48, 96%, 53%)" }  // Jaune
{ name: "En retard", color: "hsl(0, 84%, 60%)" }    // Rouge
```

### **Format des Montants**
```typescript
// Avec séparateurs de milliers
value.toLocaleString() // 45000 → "45 000"

// Avec devise
`${value.toLocaleString()} FCFA` // "45 000 FCFA"

// Abrégé (k)
`${(value / 1000).toFixed(0)}k` // 45000 → "45k"
```

---

## ✅ Checklist d'Implémentation

- [x] Créer `payment-status-chart-v2.tsx`
- [x] Créer `revenue-chart-v2.tsx`
- [x] Créer API `/api/school-admin/payments/stats`
- [x] Créer API `/api/school-admin/payments/revenue`
- [ ] Mettre à jour `app/admin/[schoolId]/page.tsx`
- [ ] Mettre à jour `app/super-admin/page.tsx`
- [ ] Tester avec données réelles
- [ ] Supprimer anciennes versions (optionnel)

---

**Graphiques avec données réelles implémentés !** 📊✅
