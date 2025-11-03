# 📁 Système d'Upload de Fichiers - AWS S3

> **Date d'implémentation**: 1er novembre 2025  
> **Statut**: ✅ Complété  
> **Version**: 1.0

---

## 🎯 Vue d'ensemble

Le système d'upload de fichiers permet aux utilisateurs de télécharger des documents, images, vidéos et autres fichiers vers AWS S3 de manière sécurisée et organisée.

---

## 📊 Architecture

### **Composants**

1. **lib/aws-s3.ts** - Configuration et fonctions utilitaires S3
2. **app/api/upload/route.ts** - API d'upload
3. **components/ui/file-upload.tsx** - Composant UI d'upload

---

## 🔧 Configuration AWS S3

### **1. Créer un Bucket S3**

```bash
# Via AWS CLI
aws s3 mb s3://schooly-files --region us-east-1

# Ou via la console AWS
# https://console.aws.amazon.com/s3/
```

### **2. Configurer les Permissions**

Créer une politique IAM pour l'upload :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::schooly-files/*",
        "arn:aws:s3:::schooly-files"
      ]
    }
  ]
}
```

### **3. Configurer CORS**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### **4. Variables d'Environnement**

Ajouter dans `.env` :

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=schooly-files
```

---

## 📦 Installation des Dépendances

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 🎨 Utilisation du Composant FileUpload

### **Exemple Basique**

```tsx
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'

function MyComponent() {
  const handleUpload = (files: UploadedFile[]) => {
    console.log('Fichiers uploadés:', files)
    // files[0].url contient l'URL du fichier sur S3
  }

  const handleError = (error: string) => {
    console.error('Erreur:', error)
  }

  return (
    <FileUpload
      onUpload={handleUpload}
      onError={handleError}
      category="document"
      multiple={true}
      maxFiles={5}
    />
  )
}
```

### **Catégories de Fichiers**

| Catégorie | Types Acceptés | Taille Max |
|-----------|---------------|------------|
| `image` | JPG, PNG, GIF, WebP | 5 MB |
| `document` | PDF, DOC, DOCX | 10 MB |
| `spreadsheet` | XLS, XLSX, CSV | 10 MB |
| `presentation` | PPT, PPTX | 20 MB |
| `video` | MP4, MPEG, MOV | 100 MB |
| `audio` | MP3, WAV, OGG | 20 MB |
| `any` | Tous types | 50 MB |

### **Props du Composant**

```typescript
interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void  // Callback après upload réussi
  onError?: (error: string) => void          // Callback en cas d'erreur
  category?: 'image' | 'document' | ...      // Catégorie de fichiers
  folder?: string                            // Dossier S3 (défaut: 'uploads')
  multiple?: boolean                         // Autoriser plusieurs fichiers
  maxFiles?: number                          // Nombre max de fichiers
  disabled?: boolean                         // Désactiver l'upload
  className?: string                         // Classes CSS personnalisées
}
```

---

## 🔌 API Routes

### **POST /api/upload**

Upload un fichier vers S3.

**Body (FormData)**:
```typescript
{
  file: File,              // Le fichier à uploader
  folder?: string,         // Dossier de destination
  category?: string        // Catégorie du fichier
}
```

**Response**:
```json
{
  "success": true,
  "file": {
    "url": "https://schooly-files.s3.us-east-1.amazonaws.com/...",
    "name": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "uploadedBy": "user_123",
    "uploadedAt": "2025-11-01T12:00:00Z"
  }
}
```

### **GET /api/upload**

Récupérer les configurations d'upload.

**Response**:
```json
{
  "configs": {
    "image": { "maxSize": 5242880, "allowedTypes": [...] },
    ...
  },
  "supportedCategories": ["image", "document", ...]
}
```

---

## 📁 Organisation des Fichiers sur S3

Les fichiers sont organisés par école, rôle et catégorie :

```
schooly-files/
├── school_123/
│   ├── school_admin/
│   │   ├── document/
│   │   ├── image/
│   │   └── ...
│   ├── teacher/
│   │   ├── document/
│   │   ├── image/
│   │   └── ...
│   ├── student/
│   │   └── ...
│   └── parent/
│       └── ...
└── global/
    └── ...
```

---

## 🎯 Cas d'Usage

### **1. Upload de Documents Pédagogiques (Teacher)**

```tsx
<FileUpload
  onUpload={(files) => {
    // Sauvegarder l'URL dans la base de données
    saveDocument({
      title: 'Cours de Mathématiques',
      fileUrl: files[0].url,
      moduleId: 'module_123'
    })
  }}
  category="document"
  folder="courses"
/>
```

### **2. Upload de Soumissions de Devoirs (Student)**

```tsx
<FileUpload
  onUpload={(files) => {
    submitHomework({
      homeworkId: 'hw_123',
      fileUrl: files[0].url
    })
  }}
  category="document"
  maxFiles={1}
/>
```

### **3. Upload de Pièces Jointes dans Messages**

```tsx
<FileUpload
  onUpload={(files) => {
    sendMessage({
      content: 'Voir pièce jointe',
      attachments: files.map(f => ({
        name: f.name,
        url: f.url,
        size: f.size,
        type: f.type
      }))
    })
  }}
  category="any"
  multiple={true}
  maxFiles={3}
/>
```

### **4. Upload de Logo École (Admin)**

```tsx
<FileUpload
  onUpload={(files) => {
    updateSchool({
      logo: files[0].url
    })
  }}
  category="image"
  maxFiles={1}
/>
```

---

## 🔒 Sécurité

### **Validation Côté Serveur**

- ✅ Vérification de l'authentification
- ✅ Validation du type de fichier
- ✅ Validation de la taille
- ✅ Isolation par école (schoolId)
- ✅ Noms de fichiers sécurisés

### **Bonnes Pratiques**

1. **Toujours valider côté serveur** - Ne jamais faire confiance au client
2. **Limiter les tailles** - Éviter les uploads trop volumineux
3. **Scanner les fichiers** - Utiliser un antivirus (optionnel)
4. **Nettoyer les anciens fichiers** - Implémenter une politique de rétention
5. **Utiliser des URLs signées** - Pour les fichiers privés (optionnel)

---

## 🚀 Fonctionnalités Avancées

### **1. Upload Direct vers S3 (Presigned URLs)**

```typescript
// Générer une URL signée
const { url, key } = await getPresignedUploadUrl('document.pdf', 'uploads')

// Upload direct depuis le client
await fetch(url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
})
```

### **2. Suppression de Fichiers**

```typescript
import { deleteFromS3 } from '@/lib/aws-s3'

// Supprimer un fichier
await deleteFromS3('https://schooly-files.s3.us-east-1.amazonaws.com/...')
```

### **3. Preview d'Images**

```tsx
{uploadedFiles.map((file) => (
  file.type.startsWith('image/') && (
    <img src={file.url} alt={file.name} className="w-32 h-32 object-cover" />
  )
))}
```

---

## 📊 Monitoring et Coûts

### **Estimer les Coûts AWS S3**

- **Stockage**: ~$0.023 par GB/mois
- **Requêtes PUT**: ~$0.005 par 1000 requêtes
- **Requêtes GET**: ~$0.0004 par 1000 requêtes
- **Transfert sortant**: ~$0.09 par GB

**Exemple** : 1000 utilisateurs, 100MB/utilisateur = 100GB
- Stockage : $2.30/mois
- Requêtes : ~$1/mois
- **Total : ~$3-5/mois**

### **Optimisations**

1. **Compression d'images** - Réduire la taille avant upload
2. **CDN (CloudFront)** - Accélérer la distribution
3. **Lifecycle policies** - Archiver ou supprimer les vieux fichiers
4. **Intelligent-Tiering** - Optimiser les coûts de stockage

---

## 🔧 Dépannage

### **Erreur : "Access Denied"**

- Vérifier les credentials AWS
- Vérifier les permissions IAM
- Vérifier la politique du bucket

### **Erreur : "File too large"**

- Augmenter `maxSize` dans la configuration
- Vérifier les limites de l'API (Next.js : 4.5MB par défaut)

### **Erreur : "CORS policy"**

- Configurer CORS sur le bucket S3
- Vérifier les origines autorisées

---

## ✅ Checklist de Déploiement

- [ ] Créer le bucket S3
- [ ] Configurer les permissions IAM
- [ ] Configurer CORS
- [ ] Ajouter les variables d'environnement
- [ ] Installer les dépendances AWS SDK
- [ ] Tester l'upload en développement
- [ ] Tester l'upload en production
- [ ] Configurer CloudFront (optionnel)
- [ ] Implémenter la suppression de fichiers
- [ ] Ajouter le monitoring

---

## 📝 Prochaines Améliorations

- [ ] Upload direct vers S3 (presigned URLs)
- [ ] Compression automatique d'images
- [ ] Génération de thumbnails
- [ ] Scan antivirus des fichiers
- [ ] Gestion des quotas par utilisateur
- [ ] Interface de gestion des fichiers
- [ ] Recherche de fichiers
- [ ] Partage de fichiers avec liens temporaires

---

**Créé le**: 1er novembre 2025  
**Auteur**: Cascade AI  
**Version**: 1.0  
**Statut**: ✅ Production Ready (après installation AWS SDK)
