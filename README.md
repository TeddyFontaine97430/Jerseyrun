# Jersey Run

Boutique en ligne réunissant plusieurs clubs sportifs. Chaque club dispose
d'un espace privé pour gérer ses articles et suivre ses ventes ; les clients
créent un compte pour suivre leur panier et leurs commandes ; un
administrateur valide les inscriptions des clubs.

Stack : Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (SQLite) +
Auth.js (NextAuth v5) + Stripe Checkout.

## Prérequis

Node.js n'est pas installé au niveau du système sur cette machine : une
version locale a été téléchargée dans `.node-local/` (spécifique à ce
projet, ignorée par git). Pour lancer une commande `npm`/`node`, préfixez le
`PATH` :

```bash
export PATH="$PWD/.node-local/bin:$PATH"
```

Si Node.js est installé par ailleurs sur la machine qui exécute ce projet,
cette étape n'est pas nécessaire.

## Installation

```bash
npm install
```

La base de données SQLite est déjà migrée et versionnée via
`prisma/migrations`. Pour repartir de zéro :

```bash
npx prisma migrate deploy
npm run db:seed
```

Le seed crée :
- un compte administrateur : `admin@jerseyrun.fr` / `ChangeMoi123!`
- 3 clubs de démonstration validés (mot de passe `Club1234!`) : AS Rugby
  Club, Basket Club Rive Gauche, Jersey Handball, chacun avec des articles
- 1 club en attente de validation (Volley Étoile) pour tester le workflow
  d'approbation admin
- une galerie photo de démonstration

Identifiants et secrets par défaut dans `.env` — **à changer avant toute
mise en production** (`ADMIN_PASSWORD`, `AUTH_SECRET`, etc.).

## Lancer le site

```bash
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Paiement en ligne (Stripe)

Le paiement utilise Stripe Checkout en mode test. Tant que les clés ne sont
pas renseignées, le tunnel d'achat affiche un message clair au lieu de
planter.

1. Créer un compte sur [stripe.com](https://dashboard.stripe.com/register)
   (ou se connecter à un compte existant).
2. Récupérer les clés de test sur
   [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
   et les renseigner dans `.env` :
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Pour recevoir la confirmation de paiement en local, utiliser le
   [Stripe CLI](https://stripe.com/docs/stripe-cli) :

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copier la clé `whsec_...` affichée dans `STRIPE_WEBHOOK_SECRET`.

Sans cette dernière étape, le paiement fonctionne mais la commande reste au
statut "En attente de paiement" au lieu de passer automatiquement à "Payée".

## Comptes de test

| Rôle   | Email                        | Mot de passe     |
|--------|-------------------------------|------------------|
| Admin  | admin@jerseyrun.fr             | ChangeMoi123!    |
| Club   | contact@as-rugby.fr             | Club1234!        |
| Club   | boutique@bcrg.fr                | Club1234!        |
| Club   | contact@jersey-handball.fr       | Club1234!        |
| Club (en attente) | contact@volley-etoile.fr | Club1234!        |

Un compte client se crée librement depuis `/inscription`.

## Options d'article (taille, pointure, autre)

En ajoutant ou modifiant un article, un club (ou l'admin) peut renseigner
jusqu'à trois groupes d'options, tous facultatifs :
- **Tailles disponibles** (ex : `S, M, L, XL`)
- **Pointures disponibles** (ex : `38, 39, 40, 41, 42`)
- **Autre option** — un nom libre (ex : `Couleur`) + ses valeurs

Si un article a au moins une option renseignée, un menu déroulant apparaît
sous l'article dans la boutique et le client doit choisir une valeur avant
de pouvoir l'ajouter à son panier. La sélection est conservée jusqu'à la
commande et visible partout où l'article apparaît (panier, compte client,
ventes du club, ventes et fiche client de l'admin).

## Espace administrateur

Depuis `/admin`, l'administrateur a une vue et un contrôle complets sur
toute la plateforme :

- **Vue d'ensemble** : chiffre d'affaires global, nombre de commandes,
  clients inscrits, validation/refus des inscriptions de clubs en attente.
- **Clubs** (`/admin/clubs`) : liste de tous les clubs. Depuis la fiche de
  chaque club (`/admin/clubs/[id]`) : coordonnées, chiffre d'affaires,
  détail des ventes, et **gestion directe des articles du club**
  (ajout/modification/masquage/suppression), comme si l'admin était
  connecté à la place du club.
- **Ventes** (`/admin/ventes`) : le détail de chaque vente réalisée, tous
  clubs confondus — article, club, quantité, montant, client (nom, email,
  téléphone) et adresse de livraison.
- **Clients** (`/admin/clients`) : liste de tous les comptes clients avec
  total dépensé ; la fiche détaillée de chaque client liste ses commandes
  et adresses de livraison.
- **Réinitialisation de mot de passe** : disponible sur la fiche d'un club
  ou d'un client. **Important** : les mots de passe sont chiffrés
  (bcrypt) et ne peuvent jamais être affichés en clair, y compris pour
  l'administrateur — c'est une garantie de sécurité standard. Le bouton
  génère un nouveau mot de passe temporaire, affiché une seule fois à
  l'écran, à transmettre au club/client concerné par un canal sûr.

L'adresse de livraison et le téléphone du client sont collectés
automatiquement par Stripe Checkout au moment du paiement (nécessite les
clés Stripe configurées, voir ci-dessus) et apparaissent ensuite dans
`/admin/ventes` et `/admin/clients`.

## Structure du projet

- `src/app` — pages et routes (App Router)
- `src/components` — composants UI partagés
- `src/lib/actions` — Server Actions (formulaires, panier, produits, admin)
- `src/lib` — Prisma, auth, Stripe, helpers
- `prisma/schema.prisma` — modèle de données
- `prisma/seed.ts` — jeu de données de démonstration

## Déploiement

Pour un déploiement en production, prévoir :
- une base de données persistante (remplacer SQLite par PostgreSQL par
  exemple, en changeant le `provider` dans `prisma/schema.prisma` et
  `DATABASE_URL`)
- des clés Stripe live + un webhook configuré sur l'URL publique
- un nouveau `AUTH_SECRET` et un mot de passe admin fort
- `NEXT_PUBLIC_BASE_URL` pointant vers le domaine public (utilisé pour les
  redirections Stripe)
