# 📁 Système d'Upload de Fichiers - Documentation

## ✅ Implémentation Complète (1er novembre 2025)

Le système d'upload de fichiers avec AWS S3 est maintenant entièrement fonctionnel et intégré dans l'application Schooly.

---

## 🎯 Fonctionnalités Implémentées

### 1. **Infrastructure AWS S3**
- ✅ Configuration client S3 (`lib/aws-s3.ts`)
- ✅ Upload vers S3 avec organisation automatique
- ✅ Suppression de fichiers
- ✅ Validation des fichiers (taille, type)
- ✅ Génération d'URLs signées (optionnel)
- ✅ Formatage de taille de fichiers

### 2. **API Routes**

#### `/api/upload` (POST, GET)
- Upload de fichiers avec catégorisation
- Organisation automatique par école/rôle/catégorie
- Validation selon le type de fichier
- Support de 6 catégories : image, document, spreadsheet, presentation, video, audio

#### `/api/documents` (GET, POST)
- Gestion des ressources pédagogiques
- CRUD complet pour les documents
- Filtrage par module et catégorie
- Vérification des permissions par école

#### `/api/documents/[id]` (GET, PUT, DELETE)
- Récupération d'un document spécifique
- Mise à jour des métadonnées
- Suppression avec nettoyage S3

#### `/api/homework/[id]/submissions` (GET, POST)
- Soumission de devoirs avec fichiers
- Récupération des soumissions
- Support de mise à jour de soumission existante

### 3. **Composants UI**

#### `FileUpload` (components/ui/file-upload.tsx)
Composant réutilisable avec :
- ✅ Drag & drop
- ✅ Sélection multiple
- ✅ Barre de progression
- ✅ Prévisualisation des fichiers
- ✅ Validation côté client
- ✅ Icônes par type de fichier
- ✅ Formatage de taille

#### `DocumentUploadDialog` (components/teacher/document-upload-dialog.tsx)
Pour les enseignants :
- ✅ Upload de ressources pédagogiques
- ✅ Catégorisation (Cours, TD, TP, Examen, Correction)
- ✅ Ajout de titre et description
- ✅ Intégration avec modules

#### `HomeworkSubmissionDialog` (components/student/homework-submission-dialog.tsx)
Pour les étudiants :
- ✅ Soumission de devoirs
- ✅ Upload de fichiers
- ✅ Ajout de commentaires
- ✅ Confirmation visuelle

---

## 📦 Structure des Fichiers

```
schooly/
├── lib/
│   └── aws-s3.ts                    # Configuration et utilitaires S3
├── app/
│   └── api/
│       ├── upload/
│       │   └── route.ts             # API upload principal
│       ├── documents/
│       │   ├── route.ts             # CRUD documents
│       │   └── [id]/route.ts        # Document spécifique
│       └── homework/
│           └── [id]/
│               └── submissions/
│                   └── route.ts     # Soumissions de devoirs
├── components/
│   ├── ui/
│   │   └── file-upload.tsx          # Composant upload réutilisable
│   ├── teacher/
│   │   └── document-upload-dialog.tsx
│   └── student/
│       └── homework-submission-dialog.tsx
├── ENV_SETUP.md                     # Guide configuration AWS
└── UPLOAD_SYSTEM.md                 # Cette documentation
```

---

## 🚀 Utilisation

### Pour les Enseignants

#### Uploader une ressource pédagogique

```tsx
import { DocumentUploadDialog } from '@/components/teacher/document-upload-dialog'

function CoursePage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        Ajouter un document
      </Button>
      
      <DocumentUploadDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        moduleId="module-123"
        onSuccess={() => {
          // Rafraîchir la liste
          router.refresh()
        }}
      />
    </>
  )
}
```

### Pour les Étudiants

#### Soumettre un devoir avec fichier

```tsx
import { HomeworkSubmissionDialog } from '@/components/student/homework-submission-dialog'

function HomeworkPage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        Soumettre le devoir
      </Button>
      
      <HomeworkSubmissionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        homeworkId="homework-123"
        homeworkTitle="Devoir Chapitre 1"
        onSuccess={() => {
          // Rafraîchir
          router.refresh()
        }}
      />
    </>
  )
}
```

### Utilisation Générique du Composant FileUpload

```tsx
import { FileUpload } from '@/components/ui/file-upload'

function MyComponent() {
  const handleUpload = (files: UploadedFile[]) => {
    console.log('Fichiers uploadés:', files)
    // files[0].url contient l'URL S3
  }

  return (
    <FileUpload
      onUpload={handleUpload}
      onError={(error) => console.error(error)}
      category="document"        // Type de fichier
      folder="my-folder"          // Dossier personnalisé
      multiple={true}             // Plusieurs fichiers
      maxFiles={5}                // Maximum 5 fichiers
    />
  )
}
```

---

## 🔧 Configuration

### Variables d'Environnement Requises

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=schooly-files
```

Voir `ENV_SETUP.md` pour la configuration complète du bucket S3.

---

## 📊 Organisation des Fichiers S3

Les fichiers sont automatiquement organisés selon cette structure :

```
s3://schooly-files/
├── school-123/
│   ├── teacher/
│   │   ├── documents/
│   │   │   └── 1699123456-cours-chapitre1.pdf
│   │   └── homework/
│   │       └── 1699123457-correction.pdf
│   ├── student/
│   │   └── homework-submissions/
│   │       └── 1699123458-devoir-rendu.pdf
│   └── admin/
│       └── reports/
│           └── 1699123459-bulletin.pdf
└── school-456/
    └── ...
```

**Format des noms** : `{timestamp}-{nom-sanitisé}.{extension}`

---

## 🛡️ Sécurité

### Validation des Fichiers

Chaque catégorie a ses propres limites :

| Catégorie | Taille Max | Types Autorisés |
|-----------|------------|-----------------|
| Image | 5 MB | JPG, PNG, GIF, WEBP |
| Document | 10 MB | PDF, DOC, DOCX |
| Spreadsheet | 10 MB | XLS, XLSX, CSV |
| Presentation | 20 MB | PPT, PPTX |
| Video | 100 MB | MP4, MPEG, MOV |
| Audio | 20 MB | MP3, WAV, OGG |
| Any | 50 MB | Tous types |

### Permissions

- ✅ Authentification requise pour upload
- ✅ Isolation par `schoolId`
- ✅ Organisation par rôle
- ✅ Vérification des permissions module/homework
- ✅ URLs publiques mais difficiles à deviner

---

## 🔄 Workflow Complet

### Upload d'un Document (Enseignant)

1. **Enseignant** clique sur "Ajouter un document"
2. **Dialog** s'ouvre avec formulaire
3. **Sélection** du fichier (drag & drop ou clic)
4. **Validation** côté client (taille, type)
5. **Upload** vers `/api/upload`
   - Fichier uploadé vers S3
   - URL retournée
6. **Création** du document via `/api/documents`
   - Métadonnées sauvegardées en DB
   - Lien avec module
7. **Confirmation** et rafraîchissement

### Soumission de Devoir (Étudiant)

1. **Étudiant** clique sur "Soumettre"
2. **Dialog** s'ouvre
3. **Ajout** commentaire + fichier
4. **Upload** vers `/api/upload`
5. **Soumission** via `/api/homework/[id]/submissions`
   - Création ou mise à jour submission
   - Lien fichier + métadonnées
6. **Confirmation** et notification enseignant

---

## 📈 Statistiques

### Fichiers Créés
- **3 API routes** (upload, documents, submissions)
- **3 composants UI** (FileUpload, DocumentUploadDialog, HomeworkSubmissionDialog)
- **1 bibliothèque utilitaire** (aws-s3.ts)
- **2 fichiers documentation** (ENV_SETUP.md, UPLOAD_SYSTEM.md)

### Lignes de Code
- ~1200 lignes de code TypeScript/React
- ~200 lignes de documentation

---

## 🎉 Prochaines Étapes

Le système d'upload est maintenant complet ! Prochaines fonctionnalités selon le plan :

1. ⏳ **Reporting Avancé**
   - Bulletins de notes PDF
   - Certificats de scolarité
   - Rapports statistiques

2. ⏳ **Notifications Email/SMS**
   - Intégration Resend/SendGrid
   - Intégration Twilio/Africa's Talking

---

## 💡 Conseils d'Utilisation

### Performance
- Les fichiers sont uploadés directement vers S3 (pas de stockage serveur)
- Utiliser la compression pour les gros fichiers
- Limiter la taille des vidéos (100MB max)

### UX
- Le drag & drop améliore l'expérience utilisateur
- La barre de progression rassure l'utilisateur
- Les icônes par type facilitent l'identification

### Maintenance
- Nettoyer régulièrement les fichiers orphelins
- Monitorer l'utilisation du bucket S3
- Vérifier les logs d'erreur upload

---

## 🐛 Dépannage

### Erreur "Non authentifié"
→ Vérifier que l'utilisateur est connecté

### Erreur "Fichier trop volumineux"
→ Vérifier les limites par catégorie

### Erreur "Type non autorisé"
→ Vérifier que le type de fichier est dans la liste autorisée

### Erreur AWS S3
→ Vérifier les variables d'environnement
→ Vérifier les permissions IAM
→ Vérifier la configuration CORS du bucket

---

**Système d'Upload de Fichiers - Implémenté avec succès le 1er novembre 2025** ✅
