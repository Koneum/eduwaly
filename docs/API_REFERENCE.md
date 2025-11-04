# Documentation API — Référence rapide

Ce document décrit l'organisation des API exposées par l'application, le rôle général de chaque zone et des exemples d'appels (méthodes / payloads attendus). Il ne liste pas chaque route en détail mais couvre les groupes d'API principaux et les endpoints les plus utilisés.

Racine des APIs : `app/api/`

Principes généraux
- Les routes suivent l'architecture Next.js App Router (route handlers dans `app/api/.../route.ts`).
- La plupart des routes utilisent Prisma (`app/generated/prisma`) pour accéder à la base de données.
- Les routes REST retournent le plus souvent des JSON `{ ok: true, data: ... }` ou `{ ok: false, error: '...' }`.
- Certaines routes sont protégées (doivent être appelées par des utilisateurs authentifiés ou par des utilisateurs avec un rôle particulier). Le middleware d'authentification se trouve dans `middleware.ts`.

Groupes d'API principaux

1. Auth
- `POST /api/auth/register` — enregistrement d'un nouvel utilisateur.
- `POST /api/auth/...` — endpoints de connexion / session (utilise le fournisseur d'auth déjà configuré).
- `GET /api/auth/get-session` — récupère la session courante (utilisé côté client pour hydrater l'état utilisateur).

2. Admin (super-admin / school-admin)
- `GET/POST/PUT/DELETE` sous `app/api/school-admin/*` — gestion des écoles, enseignants, étudiants, salles, années académiques, structures de frais.
- Exemples :
  - `POST /api/school-admin/rooms` — body: `{ schoolId, name, code, capacity, type }` — crée une salle/classe.
  - `PUT /api/school-admin/academic-years/[id]` — body: `{ annee, dateDebut?, dateFin? }` — met à jour une année.

3. Super-admin
- Endpoints pour la gestion multi-écoles, plans, souscriptions : `/api/super-admin/*`.

4. Enseignants (`/api/teacher/*`)
- Gestion des évaluations, notes, présence, devoirs.
- Exemple : `POST /api/teacher/evaluations` — body: payload d'évaluation (aligné sur le modèle Prisma `Evaluation`).

5. Étudiants / Parents
- Endpoints pour récupérer notes, devoirs, paiements, présences.
- Exemple : `GET /api/students/payments?studentId=...` — retourne les paiements d'un étudiant.

6. Messages & Notifications
- `POST /api/messages/*` — envoi de messages, récupération de conversations.
- `GET /api/notifications` — récupérer notifications; `PUT /api/notifications` pour marquer comme lu; `DELETE /api/notifications?ids=...` pour supprimer.

7. Documents & Uploads
- `POST /api/upload` — upload vers S3 (utilise `lib/aws-s3.ts`).
- `GET /api/documents/[id]` — récupération d'un document stocké.

8. Paiements (Vitepay)
- `POST /api/vitepay/create-payment` — initier un paiement.
- `GET /api/vitepay/verify-payment/[id]` — vérification du paiement.
- `POST /api/vitepay/webhook` — webhook inbound pour paiements (vérifier la structure metadata utilisée).

9. Rapports (PDF / export)
- `POST /api/reports/report-card` — génère un bulletin et retourne un blob/pdf.
- `POST /api/reports/certificate` — génère un certificat de scolarité.
- `POST /api/reports/advanced` — rapport avancé avec filtres et options (pdf/excel/csv).

10. API diverses
- `api/enroll/*` — inscription et vérification d'inscription.
- `api/semestre/[id]/pdf` — génération PDF de planning / syllabus.


Authentification & Autorisation
- Beaucoup d'API nécessitent un utilisateur authentifié; certaines actions sont réservées aux rôles `SUPER_ADMIN` / `SCHOOL_ADMIN` / `TEACHER`.
- La vérification de rôle est faite côté serveur via le token/session. Sur les routes publiques, prévoir des vérifications supplémentaires.

Exemples d'appels (JSON)

- Créer une salle
  POST /api/school-admin/rooms
  Body:
  {
    "schoolId": "string",
    "name": "Salle A",
    "code": "A101",
    "capacity": 30,
    "type": "CLASSROOM"
  }

- Marquer notification comme lu
  PUT /api/notifications
  Body:
  {
    "notificationIds": ["id1", "id2"]
  }

- Créer un paiement (Vitepay)
  POST /api/vitepay/create-payment
  Body:
  {
    "amount": 120000,
    "currency": "XOF",
    "schoolId": "...",
    "studentId": "...",
    "metadata": { "enrollmentId": "..." }
  }


Comment étendre / ajouter une route
1. Créer un dossier sous `app/api/mon-groupe/`.
2. Ajouter `route.ts` avec export async functions `GET | POST | PUT | DELETE` selon les méthodes voulues — respecter la signature `async function POST(request: Request) {}` pour routes non-dynamiques; pour dynamiques utiliser `context: { params: Promise<{ id: string }> }`.
3. Importer le client Prisma depuis `app/generated/prisma` et utiliser les types générés pour valider payloads.
4. Rédiger des tests/valider avec `npm run build` et `npx tsc --noEmit`.


Annexe: fichiers utiles
- `app/generated/prisma` — client Prisma & types
- `lib/aws-s3.ts` — upload helper
- `lib/utils.ts` — utilitaires (dates, format)
- `middleware.ts` — logique d'auth/proxy


---

Si tu veux, je peux :
- Générer automatiquement une liste exhaustive des endpoints (par lecture de `app/api`), avec pour chaque endpoint: méthode, path, fichier source, et un court exemple d'input/output.
- Ajouter un fichier OpenAPI/Swagger minimal à partir des routes les plus importantes.

Dis-moi quelle option tu préfères et je génère la suite automatiquement.
