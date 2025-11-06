# 🔧 Configuration des Variables d'Environnement (Local)

## ⚠️ Votre fichier `.env.local` est manquant ou incomplet

Le script `npm run check-env` a détecté que les variables d'environnement ne sont pas configurées.

## 📝 Étapes de Configuration

### Étape 1 : Créer le fichier `.env.local`

Dans le dossier racine du projet (`d:\react\UE-GI app\schooly`), créez un fichier nommé **`.env.local`**

### Étape 2 : Copier le contenu du template

Copiez le contenu de `env.template` dans votre nouveau fichier `.env.local`

### Étape 3 : Configurer les Variables REQUISES

#### 1. `DATABASE_URL`

Votre URL de connexion PostgreSQL. Format :
```
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
```

**Exemple avec Neon.tech :**
```
DATABASE_URL="postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/schooly?sslmode=require"
```

#### 2. `BETTER_AUTH_URL`

Pour le développement local :
```
BETTER_AUTH_URL="http://localhost:3000"
```

**IMPORTANT:** Sur Vercel, changez pour :
```
BETTER_AUTH_URL="https://eduwaly.vercel.app"
```

#### 3. `BETTER_AUTH_SECRET`

Générez une clé sécurisée avec cette commande :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez le résultat dans `.env.local` :
```
BETTER_AUTH_SECRET="votre_cle_generee_ici_64_caracteres"
```

### Étape 4 : Vérifier la Configuration

Lancez le script de vérification :
```bash
npm run check-env
```

**Résultat attendu :**
```
✅ DATABASE_URL: post...
✅ BETTER_AUTH_URL: http...
✅ BETTER_AUTH_SECRET: 1a2b...
```

### Étape 5 : Redémarrer le Serveur

Après avoir modifié `.env.local`, redémarrez :
```bash
npm run dev
```

## 📋 Exemple de `.env.local` Complet (Minimal)

```env
# Base de données
DATABASE_URL="postgresql://user:pass@host:5432/schooly?sslmode=require"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f"

# Application
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## 🚀 Configuration pour Vercel

Une fois que tout fonctionne en local, configurez les **mêmes variables** sur Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez **toutes** les variables de `.env.local`
5. **IMPORTANT:** Changez `BETTER_AUTH_URL` pour votre domaine Vercel

```env
BETTER_AUTH_URL="https://eduwaly.vercel.app"
```

## ❓ Obtenir une Base de Données PostgreSQL

Si vous n'avez pas encore de base de données :

### Option 1 : Neon.tech (Gratuit)
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte
3. Créez un nouveau projet
4. Copiez la `DATABASE_URL` fournie

### Option 2 : Supabase (Gratuit)
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un projet
3. Récupérez l'URL de connexion PostgreSQL

### Option 3 : Vercel Postgres
1. Sur votre projet Vercel
2. Storage → Create Database → Postgres
3. Copiez la `DATABASE_URL` dans vos variables d'environnement

## 🔒 Sécurité

- ❌ Ne partagez JAMAIS votre `.env.local`
- ❌ Ne committez JAMAIS `.env.local` sur Git (déjà dans `.gitignore`)
- ✅ Utilisez des clés différentes entre local et production
- ✅ Régénérez `BETTER_AUTH_SECRET` si elle est compromise

## 🆘 Besoin d'Aide ?

Si vous avez des erreurs après la configuration :

1. Vérifiez que `.env.local` est à la racine du projet
2. Redémarrez le serveur (`npm run dev`)
3. Vérifiez les logs de la console
4. Lancez `npm run check-env` pour valider
