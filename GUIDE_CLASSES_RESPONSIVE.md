# 📱 Guide des Classes Responsive Réutilisables

## ✅ Classes Ajoutées dans `globals.css`

Toutes ces classes s'adaptent **automatiquement** à tous les écrans (mobile, tablet, desktop).

---

## 📝 TEXTE RESPONSIVE

### Tailles de Texte
```tsx
// Extra Small - 10px → 12px → 14px
<p className="text-responsive-xs text-muted-foreground">
  Petit texte qui s'adapte
</p>

// Small - 12px → 14px → 16px
<p className="text-responsive-sm text-muted-foreground">
  Texte secondaire responsive
</p>

// Base - 14px → 16px → 18px
<p className="text-responsive-base">
  Texte normal responsive
</p>

// Large - 16px → 18px → 20px
<p className="text-responsive-lg">
  Texte important responsive
</p>

// XL - 18px → 20px → 24px
<p className="text-responsive-xl">
  Texte très important
</p>

// 2XL - 20px → 24px → 30px
<p className="text-responsive-2xl">
  Texte titre secondaire
</p>

// 3XL - 24px → 30px → 36px
<p className="text-responsive-3xl">
  Texte titre principal
</p>
```

### Titres (Headings)
```tsx
// H1 - 24px → 30px → 36px → 48px
<h1 className="heading-responsive-h1">
  Titre Principal
</h1>

// H2 - 20px → 24px → 30px → 36px
<h2 className="heading-responsive-h2">
  Sous-titre Important
</h2>

// H3 - 18px → 20px → 24px → 30px
<h3 className="heading-responsive-h3">
  Section Title
</h3>

// H4 - 16px → 18px → 20px → 24px
<h4 className="heading-responsive-h4">
  Sous-section
</h4>
```

---

## 📦 ESPACEMENT RESPONSIVE

### Padding
```tsx
// Padding all sides - 8px → 16px → 24px → 32px
<div className="p-responsive">
  Contenu avec padding adaptatif
</div>

// Padding horizontal - 8px → 16px → 24px → 32px
<div className="px-responsive">
  Padding gauche/droite adaptatif
</div>

// Padding vertical - 8px → 16px → 24px → 32px
<div className="py-responsive">
  Padding haut/bas adaptatif
</div>
```

### Margin
```tsx
// Margin all sides - 8px → 16px → 24px → 32px
<div className="m-responsive">
  Contenu avec margin adaptatif
</div>

// Margin horizontal - 8px → 16px → 24px → 32px
<div className="mx-responsive">
  Margin gauche/droite adaptatif
</div>

// Margin vertical - 8px → 16px → 24px → 32px
<div className="my-responsive">
  Margin haut/bas adaptatif
</div>
```

### Gap (Flex/Grid)
```tsx
// Gap - 8px → 16px → 24px → 32px
<div className="flex gap-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 📐 LAYOUT RESPONSIVE

### Container
```tsx
// Container avec padding adaptatif
<div className="container-responsive">
  Contenu centré avec padding responsive
</div>
```

### Grid
```tsx
// Grid 2 colonnes - 1 col mobile, 2 cols tablet+
<div className="grid-responsive-2">
  <div>Colonne 1</div>
  <div>Colonne 2</div>
</div>

// Grid 3 colonnes - 1 col mobile, 2 cols tablet, 3 cols desktop
<div className="grid-responsive-3">
  <div>Colonne 1</div>
  <div>Colonne 2</div>
  <div>Colonne 3</div>
</div>

// Grid 4 colonnes - 1 → 2 → 3 → 4 colonnes
<div className="grid-responsive-4">
  <div>Colonne 1</div>
  <div>Colonne 2</div>
  <div>Colonne 3</div>
  <div>Colonne 4</div>
</div>
```

---

## 🎨 COMPOSANTS RESPONSIVE

### Boutons
```tsx
// Bouton avec taille responsive
<button className="btn-responsive bg-primary text-primary-foreground rounded-md">
  Bouton Responsive
</button>
```

### Cards
```tsx
// Card avec padding responsive
<div className="card-responsive bg-card border rounded-lg">
  Contenu de la card
</div>
```

### Icônes
```tsx
// Icône normale - 16px → 20px → 24px
<Icon className="icon-responsive" />

// Icône large - 24px → 32px → 40px
<Icon className="icon-responsive-lg" />
```

---

## 💡 EXEMPLES D'UTILISATION

### Exemple 1: Texte avec Espacement
```tsx
<div className="p-responsive">
  <h2 className="heading-responsive-h2 mb-4">
    Titre de Section
  </h2>
  <p className="text-responsive-sm text-muted-foreground">
    Description qui s'adapte à tous les écrans automatiquement.
  </p>
</div>
```

### Exemple 2: Grid de Cards
```tsx
<div className="container-responsive">
  <div className="grid-responsive-3 gap-responsive">
    <div className="card-responsive">
      <h3 className="heading-responsive-h3">Card 1</h3>
      <p className="text-responsive-sm">Contenu</p>
    </div>
    <div className="card-responsive">
      <h3 className="heading-responsive-h3">Card 2</h3>
      <p className="text-responsive-sm">Contenu</p>
    </div>
    <div className="card-responsive">
      <h3 className="heading-responsive-h3">Card 3</h3>
      <p className="text-responsive-sm">Contenu</p>
    </div>
  </div>
</div>
```

### Exemple 3: Formulaire Responsive
```tsx
<form className="p-responsive space-y-4">
  <div>
    <label className="text-responsive-sm font-medium">
      Email
    </label>
    <input 
      type="email" 
      className="w-full px-responsive py-2 border rounded-md"
    />
  </div>
  
  <button className="btn-responsive bg-primary text-primary-foreground rounded-md w-full">
    Soumettre
  </button>
</form>
```

### Exemple 4: Header avec Navigation
```tsx
<header className="px-responsive py-4 border-b">
  <div className="container-responsive flex items-center justify-between">
    <h1 className="heading-responsive-h3">
      Schooly
    </h1>
    <nav className="flex gap-responsive">
      <a className="text-responsive-sm">Accueil</a>
      <a className="text-responsive-sm">À propos</a>
      <a className="text-responsive-sm">Contact</a>
    </nav>
  </div>
</header>
```

---

## 📊 BREAKPOINTS UTILISÉS

Les classes utilisent les breakpoints standard Tailwind:

- **Mobile**: < 640px (pas de préfixe)
- **Tablet**: ≥ 640px (`sm:`)
- **Desktop**: ≥ 768px (`md:`)
- **Large Desktop**: ≥ 1024px (`lg:`)
- **Extra Large**: ≥ 1280px (`xl:`)

---

## ✅ AVANTAGES

1. **Code Plus Court**: 
   ```tsx
   // Avant
   <p className="text-xs sm:text-sm md:text-base">...</p>
   
   // Après
   <p className="text-responsive-sm">...</p>
   ```

2. **Cohérence**: Tous les textes s'adaptent de la même manière

3. **Maintenance**: Modifier une fois dans `globals.css` au lieu de partout

4. **Performance**: Classes compilées par Tailwind (pas de CSS runtime)

5. **Compatible Tailwind**: Fonctionne avec toutes les autres classes Tailwind

---

## 🎯 UTILISATION RECOMMANDÉE

### ✅ À FAIRE
```tsx
// Combiner avec d'autres classes Tailwind
<p className="text-responsive-sm text-muted-foreground mt-3 text-center">
  Texte responsive avec couleur et alignement
</p>

// Utiliser pour la cohérence
<div className="grid-responsive-3 gap-responsive">
  {/* Cards */}
</div>
```

### ❌ À ÉVITER
```tsx
// Ne pas mélanger responsive classes avec media queries manuelles
<p className="text-responsive-sm sm:text-lg">
  ❌ Conflit - text-responsive-sm a déjà sm:text-sm
</p>

// Utiliser plutôt
<p className="text-responsive-base">
  ✅ Taille adaptée automatiquement
</p>
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Remplacer progressivement** les classes manuelles par les classes responsive
2. **Tester sur différents écrans** (mobile, tablet, desktop)
3. **Ajouter de nouvelles classes** si besoin dans `@layer utilities`

---

**Créé le**: 8 novembre 2025  
**Version**: 1.0  
**Projet**: Schooly - Application de Gestion Scolaire
