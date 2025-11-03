# 📊 Système de Reporting - Documentation

> **Date de création**: 2 novembre 2025  
> **Version**: 1.0  
> **Statut**: ✅ Opérationnel

## 🎯 Vue d'ensemble

Le système de reporting permet de générer automatiquement des documents PDF officiels et des rapports statistiques avancés pour l'établissement scolaire.

## 📦 Fonctionnalités

### 1. Bulletins de Notes PDF
- ✅ Génération automatique de bulletins scolaires
- ✅ Calcul des moyennes par module avec coefficients
- ✅ Moyenne générale pondérée
- ✅ Statistiques d'assiduité (absences justifiées/non justifiées)
- ✅ Classement optionnel
- ✅ Design professionnel avec couleurs Schooly

### 2. Certificats de Scolarité PDF
- ✅ Génération de certificats officiels
- ✅ Numéro unique de certificat
- ✅ Informations complètes de l'établissement
- ✅ Bordure décorative professionnelle
- ✅ Personnalisation de l'objet du certificat

### 3. Rapports Statistiques Avancés
- ✅ Rapports académiques (notes, évaluations)
- ✅ Rapports financiers (paiements, revenus)
- ✅ Rapports de présence (absences, taux)
- ✅ Rapports de performance (tendances)
- ✅ Filtrage par filière, niveau, période
- ✅ Export JSON (PDF à venir)

## 🚀 Utilisation

### Pour les Administrateurs

**Accès**: `/admin/[schoolId]/reports`

1. **Générer un bulletin**:
   - Sélectionner un étudiant
   - Choisir le semestre (S1 ou S2)
   - Cliquer sur "Générer le Bulletin PDF"
   - Le fichier est téléchargé automatiquement

2. **Générer un certificat**:
   - Sélectionner un étudiant
   - Saisir l'objet (ex: "demande de bourse")
   - Cliquer sur "Générer le Certificat PDF"

3. **Générer un rapport avancé**:
   - Choisir le type de rapport
   - Filtrer par filière (optionnel)
   - Télécharger le rapport JSON

### Pour les Enseignants

**Accès**: `/teacher/[schoolId]/reports`

Les enseignants ont accès aux bulletins et certificats pour tous les étudiants de l'école.

## 🛠️ Architecture Technique

### Fichiers Créés

```
schooly/
├── types/
│   └── reporting.ts                    # Types TypeScript
├── lib/
│   └── pdf-utils.ts                    # Utilitaires génération PDF
├── app/
│   ├── api/reports/
│   │   ├── report-card/route.ts       # API bulletins
│   │   ├── certificate/route.ts       # API certificats
│   │   └── advanced/route.ts          # API rapports avancés
│   ├── admin/[schoolId]/reports/
│   │   └── page.tsx                   # Page admin
│   └── teacher/[schoolId]/reports/
│       └── page.tsx                   # Page enseignant
├── components/reports/
│   ├── ReportCardGenerator.tsx        # Composant bulletins
│   ├── CertificateGenerator.tsx       # Composant certificats
│   └── AdvancedReportsManager.tsx     # Composant rapports
└── scripts/
    ├── create-reporting-system.ps1    # Script création auto
    └── create-reporting-components.ps1 # Script composants
```

### APIs REST

#### 1. POST `/api/reports/report-card`

**Body**:
```json
{
  "studentId": "string",
  "semester": "S1" | "S2",
  "academicYear": "2024-2025"
}
```

**Response**:
```json
{
  "studentId": "...",
  "studentName": "...",
  "enrollmentId": "...",
  "filiere": "...",
  "niveau": "...",
  "semester": "S1",
  "academicYear": "2024-2025",
  "grades": [...],
  "absences": {...},
  "average": 15.5,
  "generatedAt": "2025-11-02T17:35:00Z"
}
```

#### 2. POST `/api/reports/certificate`

**Body**:
```json
{
  "studentId": "string",
  "purpose": "demande de bourse",
  "academicYear": "2024-2025"
}
```

**Response**:
```json
{
  "studentId": "...",
  "studentName": "...",
  "enrollmentId": "...",
  "certificateNumber": "CERT-2025-1234",
  "purpose": "demande de bourse",
  "issuedAt": "2025-11-02T17:35:00Z",
  "schoolName": "...",
  "schoolAddress": "...",
  "schoolPhone": "..."
}
```

#### 3. POST `/api/reports/advanced`

**Body**:
```json
{
  "reportType": "academic" | "financial" | "attendance" | "performance",
  "period": {
    "start": "2025-01-01",
    "end": "2025-11-02"
  },
  "filters": {
    "filiere": "optional-filiere-id",
    "niveau": "L1",
    "semester": "S1"
  }
}
```

## 📊 Calculs Automatiques

### Moyenne par Module
```
Moyenne Module = Σ(Note × Coefficient) / Σ(Coefficient)
```

### Moyenne Pondérée
```
Moyenne Pondérée = Moyenne Module × Coefficient Module
```

### Moyenne Générale
```
Moyenne Générale = Σ(Moyenne Pondérée) / Σ(Coefficient Module)
```

### Taux d'Absence
```
Taux Absence = (Nombre Absences / 100 jours) × 100
```

## 🎨 Design PDF

### Couleurs Utilisées
- **Jaune Solaire**: `#FFC300` (en-têtes, accents)
- **Bleu Profond**: `#2C3E50` (textes principaux)
- **Gris**: `#6B7280` (métadonnées)

### Polices
- **Helvetica Bold**: Titres
- **Helvetica Normal**: Corps de texte

## 🔒 Sécurité

- ✅ Authentification requise (BetterAuth)
- ✅ Vérification des permissions par rôle
- ✅ Isolation par `schoolId`
- ✅ Validation des données côté serveur
- ✅ Protection contre l'accès non autorisé

## 📝 Prochaines Améliorations

- [ ] Export Excel pour rapports avancés
- [ ] Envoi automatique par email
- [ ] Signature numérique des certificats
- [ ] Historique des documents générés
- [ ] Templates personnalisables par école
- [ ] Graphiques dans les rapports PDF
- [ ] Comparaison inter-semestres
- [ ] Bulletins collectifs (toute une classe)

## 🐛 Dépannage

### Le PDF ne se télécharge pas
- Vérifier que jsPDF et jspdf-autotable sont installés
- Vérifier la console pour les erreurs
- Vérifier que les données de l'étudiant existent

### Les moyennes sont incorrectes
- Vérifier que les coefficients sont définis dans les modules
- Vérifier que les évaluations ont des coefficients
- Consulter les logs API pour les calculs

### Certificat sans informations école
- Vérifier que l'école a renseigné son adresse et téléphone
- Mettre à jour dans les paramètres de l'école

## 📞 Support

Pour toute question ou problème, consulter:
- Documentation principale: `SAAS_TRANSFORMATION_PLAN.md`
- Logs API: Console navigateur et serveur
- Issues GitHub: [Lien vers repo]

---

**Créé avec ❤️ pour Schooly SAAS**
