# ARP Gestion Magasin

Application de gestion de stock et de magasin avec contrôle des prix.

## Stack

- **Frontend :** Next.js 15 (App Router) + Tailwind CSS v4 + Recharts
- **Backend :** Next.js API Routes + Prisma ORM
- **Base de données :** PostgreSQL
- **Auth :** JWT (jsonwebtoken + jose)

## Prérequis

- Node.js 18+
- PostgreSQL

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
# Éditer .env avec vos identifiants PostgreSQL
```

## Base de données

```bash
# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Réinitialiser la base
npx prisma migrate reset

# Remplir avec des données de test
npm run prisma:seed
```



## Développement

```bash
# Démarrer PostgreSQL (exemple)
pg_ctl -D ~/arp_pgdata -l ~/arp_pgdata/logfile start

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le serveur de production |
| `npm run lint` | Vérifier le code |
| `npx prisma studio` | Interface graphique de la base de données |
| `npx prisma migrate dev` | Créer une migration après modification du schéma |
| `npx prisma migrate deploy` | Appliquer les migrations en production |

## Structure du projet

```
src/
├── app/
│   ├── (auth)/           # Pages login
│   ├── (vitrine)/        # Landing page
│   ├── api/              # API Routes
│   │   ├── achats/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── dashboard/
│   │   ├── fournisseurs/
│   │   ├── import/
│   │   ├── parametres/
│   │   ├── produits/
│   │   ├── stock/
│   │   └── ventes/
│   └── dashboard/        # Pages de l'application
│       ├── achats/
│       ├── clients/
│       ├── fournisseurs/
│       ├── import/
│       ├── parametres/
│       ├── produits/
│       ├── stock/
│       └── ventes/
├── components/           # Composants réutilisables
├── context/              # Contextes React (Auth)
├── lib/                  # Utilitaires (auth, prisma)
└── generated/            # Client Prisma généré
```

## Modèles de données

**Produit** — Produits avec prix de référence, stock initial/minimum.

**Achat / Vente** — Mouvements de stock avec alertes en cas d'écart de prix.

**Stock** — Vue consolidée (stock initial + achats - ventes).

**Fournisseur / Client** — Tiers.

**Parametre** — Configuration (seuils d'alerte, catégories, unités).

**HistoriquePrix** — Traçabilité des changements de prix.

## Rôles

- **Responsable :** accès complet (CRUD tout, paramètres, import)
- **Employé :** création d'achats et ventes uniquement, consultation du reste
