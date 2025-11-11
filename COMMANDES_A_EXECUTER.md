# ⚡ COMMANDES À EXÉCUTER MAINTENANT

## 🔴 URGENT - Générer Prisma

```bash
# 1. Générer le client Prisma avec les nouveaux modèles
npx prisma generate

# 2. Pousser les changements vers la base de données
npx prisma db push

# 3. Redémarrer le serveur de développement
npm run dev
```

## ✅ Vérifications Après Exécution

### 1. Vérifier que les tables sont créées
```bash
npx prisma studio
```
- Vérifier que la table `pdf_templates` existe
- Vérifier que la table `plans` a les champs `displayName` et `isPopular`

### 2. Tester la sauvegarde des templates
1. Aller sur `/admin/[schoolId]/bulletins`
2. Cliquer sur l'onglet "Templates"
3. Cliquer sur "Modifier le Template"
4. Modifier une configuration (ex: position du logo)
5. Cliquer sur "Sauvegarder le Template"
6. Vérifier le toast de succès ✅

### 3. Tester la page Plans Super Admin
1. Aller sur `/super-admin/plans`
2. Vérifier que la page s'affiche correctement
3. Cliquer sur "Créer un Plan"
4. Remplir le formulaire
5. Cliquer sur "Créer"
6. Vérifier que le plan apparaît dans la grille ✅

### 4. Tester les exports PDF avec infos école
1. Aller sur `/admin/[schoolId]/reports`
2. Sélectionner un type de rapport
3. Choisir "PDF" comme format
4. Cliquer sur "Générer"
5. Vérifier que le PDF contient:
   - Logo de l'école ✅
   - Adresse ✅
   - Téléphone ✅
   - Email ✅
   - Tampon (si configuré) ✅

## 📋 Si Erreurs

### Erreur: "Environment variable not found"
```bash
# Vérifier que DATABASE_URL est dans .env.local
cat .env.local | grep DATABASE_URL
```

### Erreur: "Migration failed"
```bash
# Réinitialiser la base de données (ATTENTION: perte de données)
npx prisma migrate reset
npx prisma db push
```

### Erreur: "Module not found @prisma/client"
```bash
npm install @prisma/client
npx prisma generate
```

## 🎯 Résultat Attendu

Après exécution des commandes:
- ✅ Aucune erreur TypeScript
- ✅ Table `pdf_templates` créée
- ✅ Table `plans` mise à jour
- ✅ Templates PDF sauvegardables
- ✅ Page Plans Super Admin fonctionnelle
- ✅ Exports PDF avec infos école

## 🚀 Prochaines Actions

Une fois les commandes exécutées et vérifiées:

1. **Intégrer templates dans finance-manager** (15min)
2. **Intégrer templates dans bulletins API** (15min)
3. **Créer quelques plans de test** (10min)
4. **Tester tous les exports PDF** (20min)

---

**EXÉCUTEZ CES COMMANDES MAINTENANT !** ⚡
