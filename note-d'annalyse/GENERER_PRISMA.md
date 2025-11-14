# 🔧 GÉNÉRER LE CLIENT PRISMA - URGENT

## ⚠️ ERREURS ACTUELLES

Les erreurs TypeScript suivantes sont normales et seront résolues après génération :
```
Property 'pDFTemplate' does not exist on type 'PrismaClient'
```

## 📋 COMMANDES À EXÉCUTER

### **1. Générer le client Prisma**
```bash
npx prisma generate
```

Cette commande va :
- Lire le fichier `schema.prisma`
- Générer le client TypeScript avec le nouveau modèle `PDFTemplate`
- Mettre à jour les types dans `node_modules/@prisma/client`

### **2. Pousser les changements vers la base de données**
```bash
npx prisma db push
```

Cette commande va :
- Créer la nouvelle table `pdf_templates` dans la base de données
- Ajouter les colonnes nécessaires
- Créer les index

### **3. Redémarrer le serveur de développement**
```bash
# Arrêter le serveur avec Ctrl+C
npm run dev
```

---

## ✅ VÉRIFICATION

Après avoir exécuté les commandes, vérifiez que :

1. **Aucune erreur TypeScript** dans `app/api/admin/pdf-templates/route.ts`
2. **La table existe** :
   ```bash
   npx prisma studio
   # Vérifier que la table "pdf_templates" apparaît
   ```

3. **Le template peut être sauvegardé** :
   - Aller dans Admin → Bulletins → Templates
   - Modifier la configuration
   - Cliquer sur "Sauvegarder le Template"
   - Vérifier le toast de succès

---

## 🔍 EN CAS DE PROBLÈME

### **Erreur: "Environment variable not found"**
Vérifiez que `DATABASE_URL` est dans `.env.local`

### **Erreur: "Migration failed"**
```bash
# Réinitialiser la base de données (ATTENTION: perte de données)
npx prisma migrate reset
npx prisma db push
```

### **Erreur: "Module not found @prisma/client"**
```bash
npm install @prisma/client
npx prisma generate
```

---

## 📊 MODÈLE CRÉÉ

```prisma
model PDFTemplate {
  id                String   @id @default(cuid())
  schoolId          String   @unique
  school            School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // Configuration en-tête
  showLogo          Boolean  @default(true)
  logoPosition      String   @default("left")
  headerColor       String   @default("#4F46E5")
  schoolNameSize    Int      @default(24)
  
  // Informations à afficher
  showAddress       Boolean  @default(true)
  showPhone         Boolean  @default(true)
  showEmail         Boolean  @default(true)
  showStamp         Boolean  @default(true)
  
  // Configuration tableau
  gradeTableStyle   String   @default("detailed")
  
  // Pied de page
  footerText        String   @default("Ce document est officiel et certifié conforme.")
  showSignatures    Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([schoolId])
  @@map("pdf_templates")
}
```

---

**EXÉCUTEZ CES COMMANDES MAINTENANT POUR RÉSOUDRE LES ERREURS !**
