# 🔧 Dépannage - NotificationCenter et ThemeToggle

## Problème : NotificationCenter et ThemeToggle ne s'affichent pas

### ✅ Vérifications Effectuées

Tous les fichiers de navigation ont été modifiés :
- ✅ `components/admin-school-nav.tsx`
- ✅ `components/teacher-nav.tsx`
- ✅ `components/student-nav.tsx`
- ✅ `components/parent-nav.tsx`

### 🔍 Solutions

#### 1. Redémarrer le Serveur de Développement

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm run dev
```

#### 2. Vider le Cache du Navigateur

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

#### 3. Vérifier les Erreurs dans la Console

Ouvrir la console du navigateur (F12) et vérifier s'il y a des erreurs.

#### 4. Vérifier que les Composants Existent

```bash
# Vérifier que le fichier existe
ls components/notifications/NotificationCenter.tsx
ls components/theme-toggle.tsx
```

#### 5. Vérifier les Imports

Dans chaque fichier de navigation, vérifier que l'import est correct :

```tsx
import NotificationCenter from "@/components/notifications/NotificationCenter"
import { ThemeToggle } from "@/components/theme-toggle"
```

### 📍 Emplacement dans le Code

#### Desktop (Sidebar)
Le NotificationCenter et ThemeToggle sont dans le **footer de la sidebar** :

```tsx
<div className="p-4 border-t border-border space-y-2">
  <div className="flex items-center justify-between px-4">
    <NotificationCenter />
    <ThemeToggle />
  </div>
  <Button onClick={handleSignOut} ...>
    Déconnexion
  </Button>
</div>
```

#### Mobile (Header)
Le NotificationCenter et ThemeToggle sont dans la **barre supérieure** :

```tsx
<div className="flex items-center gap-2">
  <NotificationCenter />
  <ThemeToggle />
</div>
```

### 🎯 Test Rapide

1. **Ouvrir le navigateur** sur http://localhost:3000
2. **Se connecter** avec un compte (Admin, Teacher, Student ou Parent)
3. **Regarder en bas de la sidebar** (desktop) ou **en haut à droite** (mobile)
4. Vous devriez voir :
   - 🔔 Icône de cloche (NotificationCenter)
   - 🌙/☀️ Icône de thème (ThemeToggle)

### 🐛 Si le Problème Persiste

#### Vérifier que le composant NotificationCenter fonctionne

Créer un fichier de test `app/test-notification/page.tsx` :

```tsx
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default function TestPage() {
  return (
    <div className="p-8">
      <h1>Test NotificationCenter</h1>
      <NotificationCenter />
    </div>
  )
}
```

Puis aller sur http://localhost:3000/test-notification

#### Vérifier les Erreurs TypeScript

```bash
npm run build
```

Si des erreurs TypeScript apparaissent, les corriger avant de continuer.

### 📝 Checklist de Vérification

- [ ] Serveur redémarré
- [ ] Cache navigateur vidé
- [ ] Aucune erreur dans la console
- [ ] Fichier `components/notifications/NotificationCenter.tsx` existe
- [ ] Fichier `components/theme-toggle.tsx` existe
- [ ] Imports corrects dans les 4 navigations
- [ ] Connecté avec un compte valide
- [ ] Regardé au bon endroit (footer sidebar ou header mobile)

### 🎨 Apparence Attendue

**Desktop (Sidebar)** :
```
┌─────────────────────────┐
│ Navigation Items        │
│ ...                     │
├─────────────────────────┤
│ 🔔  🌙                  │ ← NotificationCenter + ThemeToggle
│ 🚪 Déconnexion          │
└─────────────────────────┘
```

**Mobile (Header)** :
```
┌─────────────────────────────────┐
│ ☰  Titre École    🔔 🌙        │ ← NotificationCenter + ThemeToggle
└─────────────────────────────────┘
```

### 💡 Note Importante

Le **badge rouge** avec le nombre de notifications n'apparaîtra que s'il y a des notifications non lues. Si vous venez de créer le système, il est normal qu'il n'y ait pas de badge.

Pour tester avec des notifications :
1. Créer une notification via l'API
2. Ou envoyer un message à un autre utilisateur
3. Le badge devrait apparaître avec le nombre

### 🔄 Forcer le Rechargement

Si rien ne fonctionne, essayer :

```bash
# Supprimer le cache Next.js
rm -rf .next

# Réinstaller les dépendances
npm install

# Redémarrer
npm run dev
```

### 📞 Support

Si le problème persiste après toutes ces vérifications, vérifier :
1. La version de Next.js (doit être compatible)
2. Les dépendances dans `package.json`
3. Les erreurs dans `.next/server` (logs serveur)
