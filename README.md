# ARP Gestion Magasin

Application de gestion de stock et de magasin avec contrôle des prix.

## Stack Technique

- **Frontend** — Next.js 16 (App Router) + Tailwind CSS v4
- **Backend** — Next.js API Routes / Server Actions
- **Base de données** — PostgreSQL + Prisma ORM
- **UI** — shadcn/ui (minimal design)

---

## Modèle de Données (Prisma)

### Product
| Champ | Type |
|---|---|
| id | String (PK) |
| code | String (unique) |
| designation | String |
| category | String |
| unit | String |
| purchaseRefPrice | Decimal |
| saleRefPrice | Decimal |
| initialStock | Int |
| minStock | Int |
| margin | Decimal (calculated) |
| marginRate | Decimal (calculated) |
| createdAt | DateTime |
| updatedAt | DateTime |

### Purchase
| Champ | Type |
|---|---|
| id | String (PK) |
| date | DateTime |
| documentNumber | String? |
| supplierId | String? (FK → Supplier) |
| productId | String (FK → Product) |
| quantity | Int |
| unitPrice | Decimal |
| totalAmount | Decimal (calculated) |
| paymentMethod | String? |
| observation | String? |
| deviation | Decimal? (calculated) |
| alert | Boolean? (calculated) |

### Sale
| Champ | Type |
|---|---|
| id | String (PK) |
| date | DateTime |
| saleNumber | String? |
| clientId | String? (FK → Client) |
| productId | String (FK → Product) |
| quantity | Int |
| unitPrice | Decimal |
| totalAmount | Decimal (calculated) |
| paymentMethod | String? |
| observation | String? |
| deviation | Decimal? (calculated) |
| alert | Boolean? (calculated) |

### Stock
| Champ | Type |
|---|---|
| id | String (PK) |
| productId | String (FK → Product, unique) |
| initialStock | Int |
| totalPurchases | Int |
| totalSales | Int |
| currentStock | Int (calculated) |
| stockStatus | String (OK / Alerte) |
| costValue | Decimal (calculated) |
| saleValue | Decimal (calculated) |
| potentialMargin | Decimal (calculated) |

### Supplier
| Champ | Type |
|---|---|
| id | String (PK) |
| code | String (unique) |
| name | String |
| phone | String? |
| address | String? |
| ice | String? |

### Client
| Champ | Type |
|---|---|
| id | String (PK) |
| code | String (unique) |
| name | String |
| phone | String? |
| address | String? |

### Parameter
| Champ | Type |
|---|---|
| id | String (PK) |
| key | String (unique) |
| value | String |

### PriceHistory
| Champ | Type |
|---|---|
| id | String (PK) |
| productId | String (FK → Product) |
| oldPurchasePrice | Decimal? |
| newPurchasePrice | Decimal? |
| oldSalePrice | Decimal? |
| newSalePrice | Decimal? |
| changedAt | DateTime |
| reason | String? |

---

## Pages (App Router)

| Route | Contenu |
|---|---|
| `/` | Dashboard — KPIs (stock total, valeur, alertes, marges) |
| `/products` | Liste des produits avec recherche/filtre |
| `/products/new` | Formulaire ajout produit |
| `/products/[id]` | Détail produit + historique prix |
| `/purchases` | Liste des achats |
| `/purchases/new` | Formulaire nouvel achat |
| `/sales` | Liste des ventes |
| `/sales/new` | Formulaire nouvelle vente |
| `/stock` | Vue stock avec état des alertes |
| `/suppliers` | Gestion fournisseurs |
| `/clients` | Gestion clients |
| `/parameters` | Paramètres (seuil alerte, catégories, unités) |
| `/import` | Import de données depuis Excel |

---

## API / Server Actions

- `GET /api/products` — liste produits
- `POST /api/products` — créer produit
- `GET /api/products/[id]` — détail produit
- `PATCH /api/products/[id]` — modifier produit
- `GET /api/purchases` — liste achats
- `POST /api/purchases` — créer achat (met à jour stock automatiquement)
- `GET /api/sales` — liste ventes
- `POST /api/sales` — créer vente (met à jour stock + vérifie alerte prix)
- `GET /api/stock` — état du stock
- `GET /api/dashboard` — KPIs dashboard
- `POST /api/import` — import depuis xlsx
- Etc. pour fournisseurs, clients, paramètres

---

## Règles de Gestion

1. **Stock** = Stock initial + Total achats − Total ventes
2. **Alerte achat** déclenchée si `prix saisi > prix référence achat` ET écart > seuil paramétré
3. **Alerte vente** déclenchée si `prix saisi < prix référence vente` ET écart > seuil paramétré
4. **Marge** = prix vente − prix achat
5. **Taux marge** = marge / prix achat
6. L'historique des prix est conservé à chaque modification

---

## Plan de Développement

### Phase 1 — Setup & Database ✅
- [x] Initialiser projet Next.js avec TypeScript + Tailwind
- [x] Configurer Prisma avec PostgreSQL
- [x] Créer les modèles et migrations
- [x] Ajouter shadcn/ui

### Phase 2 — Auth & Layout ✅
- [x] Authentification JWT (register, login, logout, me)
- [x] Middleware de protection des routes
- [x] Pages login / register
- [x] Layout avec sidebar navigation
- [x] AuthContext provider

### Phase 3 — Produits
- [x] CRUD produits
- [ ] Import des produits depuis l'Excel (reste à faire)
- [x] Historique des prix

### Phase 4 — Achats & Ventes ✅
- [x] CRUD achats avec calcul automatique du stock
- [x] CRUD ventes avec alerte prix
- [x] Détection des écarts et alertes

### Phase 5 — Stock & Dashboard ✅
- [x] Vue stock avec indicateurs (KPIs, alertes, tableau)
- [x] Dashboard avec graphiques (Recharts : barres, camembert)
- [x] Export CSV (stock, produits)

### Phase 6 — Fournisseurs & Clients ✅
- [x] CRUD fournisseurs (GET, POST, PATCH, DELETE)
- [x] CRUD clients (GET, POST, PATCH, DELETE)

### Phase 7 — Paramètres & Import ✅
- [x] Gestion des paramètres (seuils alertes, catégories, unités)
- [x] Import de données depuis xlsx (produits + ventes historiques)
- [x] Contrôle d'import (rapport d'import avec erreurs)

### Phase 8 — Finalisation
- [ ] Tests
- [ ] Déploiement (Vercel + Supabase / Neon pour PostgreSQL)
- [ ] Documentation utilisateur

---

## Prisma Client

```typescript
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export default prisma;
```

---

## Getting Started

```bash
# PostgreSQL (port 5433)
/usr/pgsql-14/bin/pg_ctl -D ~/arp_pgdata -l ~/arp_pgdata/logfile start

# Démarrer le serveur de développement
npm run dev
```
