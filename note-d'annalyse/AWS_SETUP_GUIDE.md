# 🚀 Guide de Configuration AWS S3

## Variables d'Environnement Requises

Ajoutez ces variables dans votre fichier `.env` :

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=schooly-files
```

## Installation des Dépendances

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Étapes de Configuration AWS

### 1. Créer un Compte AWS
- Aller sur https://aws.amazon.com
- Créer un compte (carte bancaire requise)
- Activer le compte

### 2. Créer un Bucket S3
1. Aller dans la console S3 : https://console.aws.amazon.com/s3/
2. Cliquer sur "Create bucket"
3. Nom du bucket : `schooly-files` (ou autre nom unique)
4. Région : `us-east-1` (ou votre région préférée)
5. Décocher "Block all public access" (pour les fichiers publics)
6. Cliquer sur "Create bucket"

### 3. Configurer CORS sur le Bucket
1. Sélectionner votre bucket
2. Aller dans l'onglet "Permissions"
3. Descendre jusqu'à "Cross-origin resource sharing (CORS)"
4. Cliquer sur "Edit" et ajouter :

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

### 4. Créer un Utilisateur IAM
1. Aller dans IAM : https://console.aws.amazon.com/iam/
2. Cliquer sur "Users" → "Add users"
3. Nom d'utilisateur : `schooly-s3-uploader`
4. Cocher "Access key - Programmatic access"
5. Cliquer sur "Next: Permissions"

### 5. Attacher une Politique
1. Cliquer sur "Attach existing policies directly"
2. Cliquer sur "Create policy"
3. Onglet JSON, coller :

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

4. Nom de la politique : `SchoolyS3UploadPolicy`
5. Créer la politique
6. Retourner à la création d'utilisateur et attacher cette politique

### 6. Récupérer les Credentials
1. Terminer la création de l'utilisateur
2. **IMPORTANT** : Copier l'Access Key ID et le Secret Access Key
3. Ces clés ne seront plus affichées !

### 7. Ajouter les Credentials dans .env
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=schooly-files
```

## Test de la Configuration

```bash
# Démarrer le serveur
npm run dev

# Tester l'upload
# Aller sur une page avec le composant FileUpload
# Essayer d'uploader un fichier
```

## Coûts Estimés

- **Gratuit** : 5 GB de stockage + 20,000 requêtes GET + 2,000 requêtes PUT (12 premiers mois)
- **Après** : ~$0.023/GB/mois + ~$0.005/1000 PUT + ~$0.0004/1000 GET

Pour 100 utilisateurs avec 100MB chacun :
- Stockage : 10GB = ~$0.23/mois
- Requêtes : ~$0.50/mois
- **Total : < $1/mois**

## Sécurité

⚠️ **NE JAMAIS** committer les credentials AWS dans Git !
✅ Toujours utiliser `.env` (déjà dans .gitignore)
✅ Utiliser des politiques IAM restrictives
✅ Activer MFA sur le compte AWS
✅ Surveiller les coûts via AWS Budgets

## Alternative : Cloudinary (Plus Simple)

Si AWS S3 est trop complexe, vous pouvez utiliser Cloudinary :

```bash
npm install cloudinary
```

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Cloudinary offre :
- 25 GB de stockage gratuit
- 25 GB de bande passante/mois
- Interface plus simple
- Transformation d'images automatique

## Support

En cas de problème :
1. Vérifier les credentials dans .env
2. Vérifier les permissions IAM
3. Vérifier la configuration CORS
4. Consulter les logs AWS CloudWatch
5. Consulter FILE_UPLOAD_IMPLEMENTATION.md
