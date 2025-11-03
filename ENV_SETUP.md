# Configuration des Variables d'Environnement

## AWS S3 Configuration

Pour activer l'upload de fichiers, ajoutez ces variables à votre fichier `.env` :

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=schooly-files

# Next Public (pour accès client si nécessaire)
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Configuration du Bucket S3

### 1. Créer un Bucket S3

1. Connectez-vous à AWS Console
2. Allez dans S3
3. Créez un nouveau bucket (ex: `schooly-files`)
4. Région: choisissez la même que dans `AWS_REGION`

### 2. Configuration des Permissions

#### CORS Configuration

Ajoutez cette configuration CORS à votre bucket :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

#### Bucket Policy (Public Read)

Pour permettre la lecture publique des fichiers :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::schooly-files/*"
    }
  ]
}
```

### 3. Créer un Utilisateur IAM

1. Allez dans IAM > Users
2. Créez un nouvel utilisateur
3. Attachez la politique suivante :

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
        "arn:aws:s3:::schooly-files",
        "arn:aws:s3:::schooly-files/*"
      ]
    }
  ]
}
```

4. Générez les clés d'accès (Access Key ID et Secret Access Key)
5. Copiez-les dans votre `.env`

## Structure des Dossiers S3

Les fichiers sont automatiquement organisés par :
- École (schoolId)
- Rôle (teacher, student, admin)
- Catégorie (documents, homework-submissions, etc.)

Exemple : `school-123/teacher/documents/1699123456-cours.pdf`

## Types de Fichiers Supportés

### Documents
- PDF, DOC, DOCX
- Taille max: 10MB

### Images
- JPG, PNG, GIF, WEBP
- Taille max: 5MB

### Vidéos
- MP4, MPEG, MOV
- Taille max: 100MB

### Audio
- MP3, WAV, OGG
- Taille max: 20MB

### Présentations
- PPT, PPTX
- Taille max: 20MB

### Feuilles de calcul
- XLS, XLSX, CSV
- Taille max: 10MB

## Sécurité

- Les fichiers sont uploadés avec le schoolId de l'utilisateur
- Seuls les utilisateurs authentifiés peuvent uploader
- Les fichiers sont organisés par rôle pour une meilleure gestion
- Les URLs sont publiques mais difficiles à deviner (timestamp + nom sanitisé)

## Alternative : Cloudinary

Si vous préférez utiliser Cloudinary au lieu de S3, modifiez le fichier `lib/aws-s3.ts` pour utiliser l'API Cloudinary.

Variables d'environnement pour Cloudinary :

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
