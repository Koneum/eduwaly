# 🔧 Guide de Dépannage

## Erreur: POST /api/auth/sign-in/email 404

### Cause
Route BetterAuth non trouvée après modifications Prisma

### Solution

1. **Redémarrer le serveur Next.js**
   ```bash
   # Arrêter le serveur (Ctrl+C dans le terminal)
   # Puis relancer
   npm run dev
   ```

2. **Vérifier la configuration BetterAuth**
   - Le `basePath` doit être défini dans `lib/auth.ts`
   - La route catch-all doit exister dans `app/api/auth/[...all]/route.ts`

3. **Vérifier les variables d'environnement**
   ```env
   DATABASE_URL="votre_url_postgresql"
   BETTER_AUTH_SECRET="votre_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

---

## Erreur: Cannot read properties of undefined (reading 'count')

### Cause
Modèle Prisma manquant ou client Prisma non généré

### Solution

1. **Générer le client Prisma**
   ```bash
   npx prisma generate
   ```

2. **Appliquer les migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Redémarrer le serveur**

---

## Erreur: Module not found

### Cause
Import incorrect ou fichier manquant

### Solution

1. **Vérifier le chemin d'import**
   - Utiliser `@/` pour les imports absolus
   - Vérifier que le fichier existe

2. **Nettoyer le cache Next.js**
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## Erreur: AWS S3 Upload Failed

### Cause
Credentials AWS incorrects ou bucket mal configuré

### Solution

1. **Vérifier les variables d'environnement**
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=schooly-files
   ```

2. **Vérifier les permissions IAM**
   - L'utilisateur doit avoir les permissions S3
   - Voir `ENV_SETUP.md` pour la configuration

3. **Vérifier la configuration CORS du bucket**

---

## Erreur: Prisma Client Initialization Error

### Cause
Client Prisma non généré ou migration non appliquée

### Solution

```bash
# 1. Générer le client
npx prisma generate

# 2. Appliquer les migrations
npx prisma migrate dev

# 3. Si problème persiste, reset la DB (⚠️ PERTE DE DONNÉES)
npx prisma migrate reset
```

---

## Problèmes de Performance

### Symptômes
- Pages lentes à charger
- Requêtes DB lentes

### Solutions

1. **Ajouter des index**
   - Vérifier les `@@index` dans schema.prisma
   - Ajouter des index sur les colonnes fréquemment filtrées

2. **Optimiser les requêtes**
   - Utiliser `select` au lieu de `include` quand possible
   - Limiter les résultats avec `take`
   - Utiliser la pagination

3. **Activer Prisma Accelerate** (optionnel)
   ```bash
   npx prisma accelerate
   ```

---

## Erreur: Session Expired

### Cause
Session BetterAuth expirée

### Solution

1. **Se reconnecter**
   - Aller sur `/login`
   - Entrer les identifiants

2. **Augmenter la durée de session** (dans `lib/auth.ts`)
   ```typescript
   session: {
     expiresIn: 60 * 60 * 24 * 30, // 30 jours au lieu de 7
   }
   ```

---

## Erreur: Type Error dans TypeScript

### Cause
Types Prisma non à jour ou imports incorrects

### Solution

1. **Régénérer les types Prisma**
   ```bash
   npx prisma generate
   ```

2. **Redémarrer le serveur TypeScript**
   - Dans VSCode: `Ctrl+Shift+P` > "TypeScript: Restart TS Server"

---

## Commandes Utiles

### Développement
```bash
# Démarrer le serveur
npm run dev

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Ouvrir Prisma Studio
npx prisma studio
```

### Production
```bash
# Build
npm run build

# Démarrer en production
npm start
```

### Base de Données
```bash
# Voir l'état des migrations
npx prisma migrate status

# Créer une migration
npx prisma migrate dev --name nom_migration

# Reset la DB (⚠️ PERTE DE DONNÉES)
npx prisma migrate reset

# Seed la DB
npx prisma db seed
```

---

## Logs et Debugging

### Activer les logs Prisma
```typescript
// Dans lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

### Logs Next.js
- Les logs apparaissent dans le terminal où `npm run dev` est lancé
- Utiliser `console.log()` pour déboguer

### Logs BetterAuth
- Vérifier les cookies dans les DevTools du navigateur
- Onglet "Application" > "Cookies"

---

## Support

Si le problème persiste :

1. Vérifier les logs dans le terminal
2. Vérifier la console du navigateur (F12)
3. Consulter la documentation :
   - Next.js: https://nextjs.org/docs
   - Prisma: https://www.prisma.io/docs
   - BetterAuth: https://www.better-auth.com/docs

---

**Dernière mise à jour : 1er novembre 2025**
