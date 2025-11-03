# 🗺️ Structure de Navigation - Schooly SAAS

## 📋 Navigation Admin

```
┌─────────────────────────────────┐
│     Admin École                 │
│     [Nom de l'école]            │
├─────────────────────────────────┤
│ 📊 Dashboard                    │
│ 👥 Étudiants                    │
│ 📅 Emplois du Temps             │
│ 🎓 Filières/Séries              │
│ 📚 Modules/Matières             │
│ 🏢 Salles/Classes               │
│ 👨‍🏫 Enseignants                  │
│ 👤 Staff                        │
│ 📈 Statistiques                 │
│ 📄 Rapports & Documents    🆕   │  ← NOUVEAU
│ 💰 Finance & Scolarité          │
│ 💳 Prix & Bourses               │
│ 💼 Abonnement                   │
│ ⚙️  Paramètres                   │
├─────────────────────────────────┤
│ 🔔 Notifications  🌓 Theme      │
│ 🚪 Déconnexion                  │
└─────────────────────────────────┘
```

### Fonctionnalités Rapports Admin
- ✅ Bulletins de notes PDF
- ✅ Certificats de scolarité PDF
- ✅ Rapports statistiques avancés
- ✅ Tous les étudiants de l'école

---

## 📋 Navigation Teacher

```
┌─────────────────────────────────┐
│     Espace Enseignant           │
│     [Nom de l'école]            │
├─────────────────────────────────┤
│ 📊 Dashboard                    │
│ 📅 Emploi du Temps              │
│ 📚 Mes Cours                    │
│ 📝 Devoirs                      │
│ ✅ Présences                    │
│ 👥 Mes Étudiants                │
│ 📋 Notes & Évaluations          │
│ 📊 Rapports & Documents    🆕   │  ← NOUVEAU
├─────────────────────────────────┤
│ 🔔 Notifications  🌓 Theme      │
│ 🚪 Déconnexion                  │
└─────────────────────────────────┘
```

### Fonctionnalités Rapports Teacher
- ✅ Bulletins de notes PDF
- ✅ Certificats de scolarité PDF
- ✅ Tous les étudiants de l'école

---

## 📋 Navigation Student

```
┌─────────────────────────────────┐
│     Espace Étudiant             │
│     [Nom de l'école]            │
├─────────────────────────────────┤
│ 📊 Dashboard                    │
│ 📅 Emploi du Temps              │
│ 📚 Mes Cours                    │
│ 💰 Paiements                    │
│ 💬 Messages                     │
├─────────────────────────────────┤
│ 🔔 Notifications  🌓 Theme      │
│ 🚪 Déconnexion                  │
└─────────────────────────────────┘
```

### Accès Rapports Student
- 📄 Consultation de son propre bulletin (via API)
- 📄 Téléchargement de son certificat (via API)

---

## 📋 Navigation Parent

```
┌─────────────────────────────────┐
│     Espace Parent               │
│     [Nom de l'école]            │
├─────────────────────────────────┤
│ 📊 Dashboard                    │
│ 👶 Mes Enfants                  │
│ 📅 Emplois du Temps             │
│ 💰 Paiements                    │
│ 💬 Messages                     │
├─────────────────────────────────┤
│ 🔔 Notifications  🌓 Theme      │
│ 🚪 Déconnexion                  │
└─────────────────────────────────┘
```

### Accès Rapports Parent
- 📄 Consultation bulletins de ses enfants (via API)
- 📄 Téléchargement certificats de ses enfants (via API)

---

## 📋 Navigation Super-Admin

```
┌─────────────────────────────────┐
│     Super Admin                 │
│     Plateforme Schooly          │
├─────────────────────────────────┤
│ 📊 Dashboard                    │
│ 🏫 Écoles                       │
│ 💼 Abonnements                  │
│ 📈 Analytics                    │
│ 🐛 Signalements                 │
├─────────────────────────────────┤
│ 🔔 Notifications  🌓 Theme      │
│ 🚪 Déconnexion                  │
└─────────────────────────────────┘
```

### Accès Rapports Super-Admin
- 📊 Rapports globaux de la plateforme
- 📊 Statistiques multi-écoles
- 📊 Rapports financiers consolidés

---

## 🎨 Légende des Icônes

| Icône | Nom | Usage |
|-------|-----|-------|
| 📊 | LayoutDashboard | Dashboard principal |
| 👥 | Users | Gestion utilisateurs/étudiants |
| 📅 | Calendar | Emplois du temps |
| 🎓 | GraduationCap | Filières/Séries |
| 📚 | BookOpen | Modules/Matières/Cours |
| 💰 | DollarSign | Finance |
| 💳 | CreditCard | Paiements/Prix |
| ⚙️ | Settings | Paramètres |
| 📄 | FileText | Rapports (Admin) |
| 📊 | FileBarChart | Rapports (Teacher) |
| 🔔 | Bell | Notifications |
| 🌓 | Sun/Moon | Theme toggle |
| 🚪 | LogOut | Déconnexion |

---

## 📱 Responsive Design

### Desktop (≥1024px)
- Sidebar fixe à gauche (264px)
- Navigation toujours visible
- Contenu principal décalé (`lg:pl-64`)

### Mobile (<1024px)
- Header fixe en haut (64px)
- Navigation dans un drawer (Sheet)
- Bouton menu hamburger
- Contenu principal avec padding-top (`pt-16`)

---

## 🔗 URLs Complètes

### Admin
```
/admin/[schoolId]/reports
```

### Teacher
```
/teacher/[schoolId]/reports
```

### Student (API uniquement)
```
/api/reports/report-card (POST)
/api/reports/certificate (POST)
```

### Parent (API uniquement)
```
/api/reports/report-card (POST)
/api/reports/certificate (POST)
```

---

## 🎯 Prochaines Améliorations Navigation

- [ ] Badges de notification sur les liens
- [ ] Indicateur de nouvelles fonctionnalités
- [ ] Raccourcis clavier
- [ ] Recherche rapide dans la navigation
- [ ] Favoris personnalisables
- [ ] Historique de navigation

---

**Structure mise à jour le**: 2 novembre 2025  
**Version**: 1.0
