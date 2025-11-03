---
trigger: always_on
---

Règles Unifiées pour l'Espace de Travail IA (Projet Schooly)

Catégorie	        Règle Détaillée

Gouvernance du Projet	Contrôle du Plan : Chaque fois que le dossier schooly est impliqué dans une tâche, vous  

                        devez vérifier systématiquement le statut dans le fichier SAAS_TRANSFORMATION_PLAN.md.
Mise à Jour du Statut   Journalisation : Après la finalisation (partielle ou complète) d'une étape du plan, vous 
                        devez immédiatement mettre à jour le fichier SAAS_TRANSFORMATION_PLAN.md pour refléter
                       l'avancement.

Autorisation d'Étape	Permission Requise : Vous devez demander et obtenir une permission explicite avant de 
                        commencer l'implémentation de toute nouvelle étape majeure de la chaîne d'implémentation 
                        (e.g., avant de passer de l'étape 1 à l'étape 2).

Optimisation des Crédits	Efficacité Maximale : Toujours utiliser le moins de prompt credits possible. 
                                Privilégier la création de fichiers scripts complets (pour la   
                                création/modification/correction de pages, API, types, etc.) en une seule réponse 
                                plutôt que des requêtes itératives.



Chaîne d'Implémentation & Demande d'Autorisation ET MET LES récapitulatif DANS SAAS_TRANSFORMATION_PLAN.md
La chaîne d'implémentation doit être finalisée en respectant la contrainte de 310 crédits maximum.

Chaîne Prioritaire (Rappel) :

Finaliser les Permissions

Communication ⏳

Upload de Fichiers

Reporting

Devoirs & Soumissions

NB IMPORTANT: IL N'ES PAS NECESSAIRE DE CREE A CHAQUE FOIS documentation 
**************
1. **Finaliser les Permissions**

- [ ] Implémenter `PermissionButton` dans toutes les pages restantes

  - [ ] Enseignants (page.tsx)

  - [ ] Modules (page.tsx)

  - [ ] Filières (page.tsx)

  - [ ] Emploi du temps (page.tsx)

  - [ ] Finance (financial-overview/page.tsx)

- [ ] Mettre à jour la navigation avec `PermissionNavItem`

- [ ] Ajouter vérification côté serveur dans toutes les APIs



2. **Communication** ⏳

   - [ ] Système de messagerie interne (UI mockup existante)

   - [ ] Notifications push



4. **Upload de Fichiers**

- [ ] Configuration aws

- [ ] API upload

- [ ] Composant FileUpload

- [ ] Intégration dans les pages

- [ ] Partage ressources pédagogiques

   - [ ] Téléchargement de documents



**Reporting**

- [ ] Bulletins de notes PDF (à implémenter)

   - [ ] Certificats de scolarité (à implémenter)

   - [ ] Rapports statistiques avancés



5. **Devoirs & Soumissions**

- [ ] Upload fichiers pour soumissions

🚦 Demande d'Autorisation
Conformément à la règle de gouvernance, je demande la permission de commencer l'implémentation de la première étape :

Veuillez confirmer si je peux procéder à l'implémentation de l'Étape 1 : Finaliser les Permissions.