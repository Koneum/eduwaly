# 🐛 Guide Debug - Problème Login Vercel

## 🚀 Étape 1: Déployer avec les Logs

```bash
git add .
git commit -m "debug: ajout logs cookies Vercel"
git push origin main
```

Attendez 2-3 minutes que Vercel build et déploie.

## 🔍 Étape 2: Vérifier les Logs Browser

1. Ouvrir https://eduwaly.vercel.app
2. F12 → Console
3. Se connecter
4. Observer les logs:

```
🔐 [LOGIN] Tentative de connexion pour: xxx
✅ [LOGIN] SignIn réussi
🔄 [LOGIN] Récupération URL redirection
📡 [LOGIN] Response status: 200
📍 [LOGIN] Données redirection: {...}
🚀 [LOGIN] Redirection vers: /admin/xxx
```

## 🔍 Étape 3: Vérifier les Logs Vercel

1. Dashboard Vercel → Votre projet
2. Onglet "Logs" ou "Functions"
3. Chercher ces logs:

```
🔧 [AUTH] Using BETTER_AUTH_URL: https://eduwaly.vercel.app
OU
⚠️ [AUTH] Using VERCEL_URL (preview): https://xxx.vercel.app
```

**Si vous voyez "Using VERCEL_URL":**
→ BETTER_AUTH_URL n'est PAS défini sur Vercel!
→ C'est le problème!

## ✅ Étape 4: Vérifier Variables Vercel

1. Dashboard Vercel → Settings → Environment Variables
2. Vérifier:

```
BETTER_AUTH_URL = https://eduwaly.vercel.app
BETTER_AUTH_SECRET = [votre clé 64 caractères]
DATABASE_URL = postgresql://...
```

**IMPORTANT:**
- Pas d'espace avant/après les valeurs
- HTTPS pour BETTER_AUTH_URL
- Pas de slash final (/)

## 🔍 Étape 5: Logs API Redirect

Dans les logs Vercel Functions, chercher:

```
📍 [REDIRECT-API] Requête reçue
🍪 [REDIRECT-API] Cookies reçus: OUI/NON
👤 [REDIRECT-API] Récupération utilisateur...
✅ [REDIRECT-API] Utilisateur trouvé: {...}
🚀 [REDIRECT-API] URL redirection: /admin/xxx
```

**Si "Cookies reçus: NON":**
→ Les cookies ne sont pas envoyés!
→ Vérifier credentials: include

**Si "Aucun utilisateur trouvé":**
→ Les cookies sont invalides
→ Vérifier BETTER_AUTH_URL

## 🐛 Scénarios Possibles

### Scénario 1: BETTER_AUTH_URL Manquant
```
⚠️ [AUTH] Using VERCEL_URL (preview)
🍪 [REDIRECT-API] Cookies reçus: OUI
❌ [REDIRECT-API] Aucun utilisateur - invalides
```

**Solution:**
Définir BETTER_AUTH_URL sur Vercel

### Scénario 2: Cookies Non Envoyés
```
📍 [REDIRECT-API] Requête reçue
🍪 [REDIRECT-API] Cookies reçus: NON
```

**Solution:**
Vérifier credentials: include dans fetch

### Scénario 3: Tout Fonctionne
```
✅ [LOGIN] SignIn réussi
🍪 [REDIRECT-API] Cookies reçus: OUI
✅ [REDIRECT-API] Utilisateur trouvé
🚀 [LOGIN] Redirection vers: /admin/xxx
```

**Résultat:** Redirection réussie!

## 📝 Checklist

- [ ] Logs ajoutés et déployés
- [ ] Console browser ouverte
- [ ] BETTER_AUTH_URL défini sur Vercel
- [ ] Cookies visibles dans DevTools
- [ ] Logs Vercel Functions vérifiés
- [ ] Redirection fonctionne

## 🆘 Si Rien Ne Marche

Partagez ces informations:
1. Logs console browser (screenshot)
2. Logs Vercel Functions (texte)
3. Variables Vercel (masquez les secrets)
4. Cookies dans DevTools (screenshot)
