# ✅ FIX TIMEOUT IMAGES S3

## 🔴 PROBLÈME

```
Error [TimeoutError]: The operation was aborted due to timeout
GET /_next/image?url=https://eduwaly.s3.us-east-1.amazonaws.com/school-stamps/...
500 in 7.3s
```

**Cause**: Next.js Image tente d'optimiser les images S3 mais timeout après 7 secondes.

---

## ✅ SOLUTIONS APPLIQUÉES

### **1. Configuration Next.js Image**

**Fichier**: `next.config.ts`

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.amazonaws.com',
    },
    {
      protocol: 'https',
      hostname: 'eduwaly.s3.us-east-1.amazonaws.com',
    },
  ],
  // Désactiver l'optimisation pour éviter les timeouts S3
  unoptimized: true,
  // Augmenter le cache
  minimumCacheTTL: 60,
}
```

**Changements**:
- ✅ Hostname spécifique pour S3
- ✅ `unoptimized: true` → Pas d'optimisation Next.js
- ✅ `minimumCacheTTL: 60` → Cache de 60 secondes

### **2. Suppression ACL Public-Read**

**Fichier**: `lib/aws-s3.ts`

```typescript
// Avant
const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  Body: buffer,
  ContentType: contentType,
  ACL: 'public-read', // ❌ Peut être bloqué par AWS
})

// Après
const command = new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  Body: buffer,
  ContentType: contentType,
  // Note: ACL 'public-read' peut être bloqué par la config du bucket
  // Utiliser plutôt une politique de bucket ou des URLs signées
})

try {
  await s3Client.send(command)
} catch (error) {
  console.error('Erreur upload S3:', error)
  throw new Error('Échec de l\'upload vers S3')
}
```

**Changements**:
- ✅ Suppression ACL (souvent bloqué par AWS)
- ✅ Meilleure gestion d'erreur
- ✅ Logs pour debug

### **3. Gestion d'Erreur dans les Composants**

**Fichier**: `components/admin/school-stamp-uploader.tsx`

```typescript
const [imageError, setImageError] = useState(false)

<Image
  src={previewUrl}
  alt={`Cachet ${schoolName}`}
  fill
  className="object-contain p-2"
  onError={() => {
    console.error('Erreur chargement image stamp:', previewUrl)
    setImageError(true)
    toast.error('Impossible de charger l\'image')
  }}
  unoptimized // Pas d'optimisation Next.js
/>
```

**Changements**:
- ✅ État `imageError` pour gérer les erreurs
- ✅ Handler `onError` avec toast
- ✅ `unoptimized` sur l'image
- ✅ Logs console pour debug

---

## 🔧 CONFIGURATION AWS S3 REQUISE

### **Option 1: Politique de Bucket Publique** (Recommandé)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eduwaly/*"
    }
  ]
}
```

**Étapes**:
1. AWS Console → S3 → Bucket `eduwaly`
2. Permissions → Bucket Policy
3. Coller la politique ci-dessus
4. Sauvegarder

### **Option 2: Désactiver "Block Public Access"**

1. AWS Console → S3 → Bucket `eduwaly`
2. Permissions → Block public access
3. Edit → Décocher toutes les options
4. Sauvegarder

⚠️ **Attention**: Cela rend le bucket public. Assurez-vous que c'est voulu.

### **Option 3: URLs Signées** (Plus sécurisé)

```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function getSignedImageUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  
  // URL valide pendant 1 heure
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return url
}
```

---

## 🧪 TESTS

### **1. Vérifier l'Upload**

```bash
# Démarrer le serveur
npm run dev

# Accéder à la page
http://localhost:3000/admin/[schoolId]/settings
```

**Actions**:
1. Aller dans l'onglet "Logo & Cachet"
2. Uploader une image de cachet
3. Vérifier le toast de succès
4. Vérifier que l'image s'affiche

### **2. Vérifier les URLs S3**

```bash
# Dans la console du navigateur
# Copier l'URL de l'image qui timeout
https://eduwaly.s3.us-east-1.amazonaws.com/school-stamps/...

# Ouvrir dans un nouvel onglet
# Si erreur 403 → Problème de permissions S3
# Si erreur 404 → Fichier n'existe pas
# Si image s'affiche → Problème avec Next.js Image
```

### **3. Vérifier la Base de Données**

```sql
-- Vérifier les URLs stockées
SELECT id, name, stamp FROM schools WHERE stamp IS NOT NULL;

-- Exemple de résultat attendu
-- stamp: https://eduwaly.s3.us-east-1.amazonaws.com/school-stamps/1762808458526-stamp-...
```

---

## 🔍 DIAGNOSTIC

### **Erreur 403 Forbidden**

**Cause**: Permissions S3 insuffisantes

**Solution**:
1. Appliquer une politique de bucket publique
2. Ou utiliser des URLs signées

### **Erreur 404 Not Found**

**Cause**: Le fichier n'existe pas sur S3

**Solution**:
1. Vérifier que l'upload a réussi
2. Vérifier les logs du serveur
3. Re-uploader l'image

### **Timeout après 7 secondes**

**Cause**: Next.js Image tente d'optimiser mais timeout

**Solution**:
1. ✅ `unoptimized: true` dans next.config.ts
2. ✅ `unoptimized` sur le composant Image
3. Redémarrer le serveur

---

## 📝 CHECKLIST

- [x] Configurer `unoptimized: true` dans next.config.ts
- [x] Ajouter hostname S3 dans remotePatterns
- [x] Supprimer ACL public-read de aws-s3.ts
- [x] Ajouter gestion d'erreur dans composants
- [x] Ajouter `unoptimized` sur composants Image
- [ ] Configurer politique de bucket S3
- [ ] Tester upload d'image
- [ ] Vérifier affichage sans timeout
- [ ] Redémarrer le serveur dev

---

## 🚀 COMMANDES

```bash
# Redémarrer le serveur (IMPORTANT)
# Arrêter avec Ctrl+C
npm run dev

# Vérifier les variables d'environnement
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION
echo $AWS_S3_BUCKET

# Tester l'accès S3 (optionnel)
aws s3 ls s3://eduwaly/school-stamps/
```

---

## 💡 RECOMMANDATIONS

### **Court Terme**

1. **Utiliser `unoptimized: true`**
   - Pas d'optimisation Next.js
   - Pas de timeout
   - Images chargées directement depuis S3

2. **Configurer les permissions S3**
   - Politique de bucket publique
   - Ou URLs signées pour plus de sécurité

### **Long Terme**

1. **CDN CloudFront**
   - Mettre un CDN devant S3
   - Meilleure performance
   - Cache global

2. **URLs Signées**
   - Plus sécurisé
   - Contrôle d'accès
   - Expiration automatique

3. **Compression d'Images**
   - Réduire la taille avant upload
   - Format WebP
   - Optimisation côté client

---

## 🔐 SÉCURITÉ

### **Politique de Bucket Recommandée**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eduwaly/school-logos/*"
    },
    {
      "Sid": "PublicReadGetObject2",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eduwaly/school-stamps/*"
    }
  ]
}
```

**Avantages**:
- ✅ Accès public seulement pour logos et stamps
- ✅ Autres dossiers restent privés
- ✅ Pas besoin d'ACL sur chaque fichier

---

## ✅ RÉSULTAT ATTENDU

Après ces modifications:

1. **Upload**:
   - ✅ Image uploadée vers S3
   - ✅ URL stockée en base
   - ✅ Toast de succès

2. **Affichage**:
   - ✅ Image chargée sans timeout
   - ✅ Pas d'erreur 500
   - ✅ Affichage instantané

3. **Performance**:
   - ✅ Pas d'optimisation Next.js (pas de timeout)
   - ✅ Cache de 60 secondes
   - ✅ Chargement direct depuis S3

---

## 🔧 DÉPANNAGE

### **Si timeout persiste**

1. **Vérifier la configuration**
   ```bash
   # Redémarrer le serveur
   npm run dev
   ```

2. **Vérifier les permissions S3**
   ```bash
   # Tester l'URL directement dans le navigateur
   https://eduwaly.s3.us-east-1.amazonaws.com/school-stamps/...
   ```

3. **Vérifier les logs**
   ```bash
   # Dans le terminal du serveur
   # Chercher "Erreur upload S3" ou "Erreur chargement image"
   ```

### **Si erreur 403**

1. Appliquer la politique de bucket
2. Ou désactiver "Block Public Access"
3. Ou utiliser des URLs signées

### **Si erreur 404**

1. Vérifier que le fichier existe sur S3
2. Re-uploader l'image
3. Vérifier l'URL en base de données

---

**LES TIMEOUTS S3 DEVRAIENT MAINTENANT ÊTRE RÉSOLUS !** 🎉

**IMPORTANT**: Redémarrez le serveur dev pour appliquer les changements de `next.config.ts`.
