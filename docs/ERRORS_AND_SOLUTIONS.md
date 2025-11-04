# Résumé des erreurs rencontrées et solutions appliquées

Ce document rassemble les erreurs TypeScript / Next.js / Prisma / ESLint rencontrées lors de la mise au propre du projet et les corrections appliquées. Il sert de mémo opérationnel pour reproduire ou corriger des problèmes similaires.

## Principales erreurs et leur cause

1. Object literal may only specify known properties (Prisma create/update)
   - Cause : on envoyait des champs dans les payloads `create` / `update` qui n'existent pas dans le schéma Prisma (ex: `startDate`, `endDate` pour `Scholarship`).
   - Solution : aligner le body envoyé par l'API avec les types générés par Prisma (ou modifier le schéma + générer le client si on veut garder le champ). Exemple : vérifier `app/generated/prisma/index.d.ts` pour les Input types.

2. Dynamic route handler signature mismatch (Next.js App Router)
   - Cause : handlers pour des routes dynamiques qui ne respectaient pas la forme `context: { params: Promise<{ id: string }> }` attendue (Next.js strict typing avec params as Promise).
   - Solution : corriger la signature des route handlers et `await params` quand on lit `params.id`.

3. Utilisation d'un modèle supprimé (`verificationCode`) vs modèle existant (`Verification`)
   - Cause : le code faisait référence à un modèle qui n'existe plus dans le schéma Prisma.
   - Solution : remplacer les appels `prisma.verificationCode.*` par `prisma.verification.*` en adaptant les propriétés (ex: `identifier`, `value`, `expiresAt`).

4. `Module has no exported member 'UserRole'` / Prisma types import
   - Cause : import incorrect de types Prisma depuis `@prisma/client` dans un environnement où on utilise le client généré dans l'app (`app/generated/prisma`).
   - Solution : importer les types depuis le client généré du projet (`app/generated/prisma`) ou utiliser des unions locales pour éviter des dépendances manquantes.

5. Missing exports/utilities (formatDateToFr / formatHourRange)
   - Cause : routes PDF utilisaient des helpers non exportés.
   - Solution : ajouter ces utilitaires dans `lib/utils.ts` ou centraliser les fonctions partagées.

6. Vitepay typings / webhook mismatches
   - Cause : types d'intégration (ex: `paymentUrl`) et champ de métadonnées différents entre ce que renvoie l'API externe et ce qui était attendu.
   - Solution : rendre certains champs optionnels dans les types, et adapter la logique du webhook pour chercher les bonnes propriétés (`id` dans metadata au lieu de `vitepaySubscriptionId`).

7. `Property 'arrayBuffer' does not exist on type 'File | Buffer'` (aws-s3 upload)
   - Cause : code traitait des inputs file/Buffer sans normaliser les types (Node Buffer n'a pas `.arrayBuffer()` dans tous les contextes).
   - Solution : accepter `File | Buffer | ArrayBuffer | Uint8Array` et normaliser via `Buffer.isBuffer` / `file.arrayBuffer()` conditions.

8. Seed script errors (missing id, hashedPassword variable, unused vars)
   - Cause : modifications partielles ont laissé des variables non définies / non utilisées; `Account.create` attendait un `id` dans `UncheckedCreateInput`.
   - Solution : ajout d'`id` (ex: `crypto.randomUUID()`), consolidation d'un `commonHashedPassword`, et suppression/`await` des variables non utilisées.

9. `Property 'className' does not exist on type 'AlertDialogPortalProps'` (Radix Portal)
   - Cause : on passait `className` au composant Radix `Portal` qui ne l'accepte pas.
   - Solution : créer un wrapper `AlertDialogPortal` qui accepte `className?: string` et applique la classe au conteneur DOM interne.

10. DayPicker components typing (IconLeft/IconRight)
    - Cause : fournir des clés non standard dans l'objet `components` sans typer l'objet.
    - Solution : caster l'objet `components` sur le type attendu (`CalendarProps['components']`) et supprimer props inutilisés dans les lambdas.

11. ESLint - no-explicit-any
    - Cause : usages répétitifs de `any` pour raccourcir les casts (ex: `session.user as any`).
    - Solution : remplacer par `unknown` puis narrower, ou définir des types locaux (ex: `as unknown as { role?: UserRole }`).

12. React lint - Avoid calling setState() directly within an effect
    - Cause : l'effet appelait `loadNotifications()` directement dans le body de l'effet, provoquant potentiellement un setState synchrones.
    - Solution : décaler l'appel initial via `setTimeout(() => loadNotifications(), 0)` (ou appeler le loader depuis l'UI initiale) et garder `setInterval` pour le polling.


## Recommandations générales

- Toujours vérifier les types Prisma générés (`app/generated/prisma/index.d.ts`) quand on édite des payloads pour `prisma.create`/`prisma.update`.
- Favoriser `unknown` + narrowing plutôt que `any`.
- Pour les effets React qui font setState: appeler la mise à jour dans une callback asynchrone (setTimeout/Promise.resolve) ou déplacer la logique hors de l'effet si approprie.
- Centraliser utilitaires partagés dans `lib/` et exporter explicitement.
- Quand vous changez le schéma Prisma, exécuter `npx prisma generate` et corriger les appels code côté serveur.


## Emplacements des corrections les plus importantes

- `prisma/seed.ts` — fix id & password handling
- `app/api/*` — corrections de payloads et signatures de route handlers
- `lib/utils.ts` — ajout de `formatDateToFr`, `formatHourRange`
- `lib/aws-s3.ts` — gestion robuste des types de fichier
- `y/alert-dialog.tsx` — Portal wrapper (className)
- `y/calendar.tsx` — cast des `components` pour DayPicker
- `components/notifications/NotificationCenter.tsx` — setTimeout pour l'appel initial
- `lib/auth-context.tsx` & `hooks/useUploadPermissions.ts` — suppression des `any` via `unknown`


## Checklist pour corriger un nouvel incident similaire

1. Lire l'erreur TypeScript/ESLint et localiser le fichier et la ligne précise.
2. Consulter les types générés (Prisma / types locaux) avant d'ajouter/supprimer des champs d'un objet payload.
3. Remplacer les `any` par `unknown` puis effectuer un narrowing explicite.
4. Pour les effets React : éviter les setState synchrones dans l'effet; utiliser un timer asynchrone ou déplacer la logique.
5. Re-run `npm run build` pour voir les erreurs suivantes et itérer.


---

Si tu veux, je peux ajouter des exemples de correctifs avant/après pour chaque erreur (ex: diff concret pour `prisma.create` ou `NotificationCenter`). Dis-moi si tu veux des exemples précis.
