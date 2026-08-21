# Gestion Boutique — Stock, Commandes & Livraison

Application de gestion pour un commerçant sénégalais (lunettes, montres,
accessoires de téléphone) : catalogue public avec commande en ligne (paiement
à la livraison), et espace de gestion pour le propriétaire et ses employés
(stock, commandes, livraisons, rapports).

- 🇫🇷 Interface en français, devise **FCFA (XOF)**
- 📱 **Mobile-first**, PWA installable, pensée pour une connexion parfois faible
- 🔧 Backend **PHP + MySQL** en PDO, sans framework, déployable sur hébergement mutualisé
- ⚛️ Frontend **React + Vite**, Tailwind CSS

## Sommaire

- [Stack technique](#stack-technique)
- [Arborescence](#arborescence)
- [Installation en local](#installation-en-local)
- [Comptes de test](#comptes-de-test-seed)
- [Déploiement en production](#déploiement-en-production-hébergement-mutualisé)
- [PWA & hors-ligne](#pwa--hors-ligne)
- [Notes techniques](#notes-techniques)
- [Roadmap v2](#roadmap-v2-non-codé)

## Stack technique

| Côté | Techno |
|---|---|
| Frontend | React 18 + Vite 5, React Router 6, Context API, Tailwind CSS 3, `vite-plugin-pwa` |
| Backend | PHP 8.1+, PDO (requêtes préparées), routeur maison, JWT fait main (HS256, zéro dépendance) |
| Base de données | MySQL / MariaDB |
| Auth | JWT (Bearer token), rôles `admin` / `employe` |

Aucune dépendance Composer n'est requise côté backend (voir [Notes techniques](#notes-techniques)) : l'API est déployable par simple upload FTP.

## Arborescence

```
gestion-boutique/
├── backend/                  # API PHP (front controller : index.php)
│   ├── api...                # (routes déclarées dans index.php)
│   ├── config/config.php     # Lecture du .env
│   ├── src/
│   │   ├── Core/             # Router, Request, Response, Database (PDO), Env
│   │   ├── Auth/             # Jwt.php, Middleware.php
│   │   ├── Helpers/          # Validator.php
│   │   ├── Notifications/    # NotificationManager + canal WhatsApp (v1)
│   │   └── Controllers/      # Un contrôleur par ressource
│   ├── uploads/produits/     # Images uploadées (servies statiquement)
│   ├── index.php             # Point d'entrée (toutes les requêtes)
│   ├── router-dev.php        # Routeur pour `php -S` en local uniquement
│   └── .env.example
├── frontend/                 # React + Vite (PWA)
│   └── src/
│       ├── api/               # Un module par ressource (fetch + JWT)
│       ├── context/            # AuthContext, PanierContext
│       ├── components/         # ui/, layout/, produits/
│       └── pages/{public,admin}/
├── database/
│   └── schema.sql            # Structure + données de test (seed)
└── README.md                 # ce fichier
```

## Installation en local

### Prérequis

- PHP ≥ 8.1 avec l'extension `pdo_mysql`
- MySQL ou MariaDB
- Node.js ≥ 18 et npm

### 1. Base de données

```bash
mysql -u root -p < database/schema.sql
```

Cela crée la base `gestion_boutique`, ses tables, et des données de test
(catégories, produits, un admin, un employé, quelques commandes).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env : DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, JWT_SECRET...
```

Générez un `JWT_SECRET` solide :

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Lancez le serveur de développement PHP intégré (utilise `router-dev.php` pour
reproduire le comportement du `.htaccess`, que `php -S` ignore sinon) :

```bash
php -S localhost:8000 router-dev.php
```

L'API est alors disponible sur `http://localhost:8000/api/...`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL peut rester vide en dev (proxy Vite)
npm run dev
```

Ouvrez `http://localhost:5173`. En dev, Vite proxifie automatiquement `/api`
et `/uploads` vers `http://127.0.0.1:8000` (voir `vite.config.js`) — pas de
souci CORS à gérer en local.

## Comptes de test (seed)

| Rôle | Téléphone | Mot de passe |
|---|---|---|
| Propriétaire (admin) | `221771234567` | `admin123` |
| Employé | `221781112233` | `employe123` |

⚠️ À changer avant toute mise en production (page **Utilisateurs**, réservée à l'admin).

## Déploiement en production (hébergement mutualisé)

### Backend

1. Importez `database/schema.sql` via phpMyAdmin (ou en SSH si disponible).
   Remplacez ensuite les données de seed par vos vraies catégories/produits,
   et changez immédiatement les mots de passe des comptes de test.
2. Uploadez le contenu de `backend/` dans un dossier de votre hébergement
   (ex: un sous-domaine `api.mondomaine.sn`, ou `mondomaine.sn/api/`).
3. Créez le fichier `.env` sur le serveur (ne jamais uploader votre `.env` local
   directement si son contenu diffère — recréez-le avec les vrais identifiants
   MySQL fournis par votre hébergeur, `DB_HOST` est souvent `localhost`).
4. Vérifiez que le module Apache `mod_rewrite` est actif (standard sur cPanel) :
   c'est lui qui fait fonctionner `backend/.htaccess`.
5. Le dossier `backend/uploads/` doit être accessible en écriture par PHP
   (permissions `755` ou `775` selon l'hébergeur).

### Frontend

1. Configurez `frontend/.env.production` avec l'URL réelle de l'API :
   ```
   VITE_API_URL=https://api.mondomaine.sn
   ```
   (laissez vide si le frontend et l'API partagent le même domaine, ex: API sur `mondomaine.sn/api/`)
2. Générez le build de production :
   ```bash
   npm run build
   ```
   *(Note Node 18 — voir [Notes techniques](#notes-techniques) si la commande échoue avec une erreur `crypto is not defined`.)*
3. Uploadez le **contenu** du dossier `frontend/dist/` (pas le dossier lui-même)
   à la racine de votre `public_html` (ou du sous-dossier servant le site).
   Le fichier `.htaccess` inclus gère la navigation React Router (SPA).
4. Mettez à jour `backend/.env` : `CORS_ALLOWED_ORIGINS=https://mondomaine.sn`
   (le domaine réel du frontend, sans slash final).

### Après déploiement

- Connectez-vous à `/gestion/connexion` avec le compte admin, allez dans
  **Utilisateurs** pour changer les mots de passe par défaut.
- Dans la table `parametres` (via phpMyAdmin), mettez à jour `nom_boutique`,
  `whatsapp_proprietaire` (numéro international sans "+", ex: `221771234567`)
  et `adresse_boutique`.

## PWA & hors-ligne

- L'app est installable (bouton "Ajouter à l'écran d'accueil" sur mobile,
  icône d'installation sur desktop) grâce au manifest + service worker
  générés par `vite-plugin-pwa`.
- Le **catalogue public** (`/api/public/*`) est mis en cache (stratégie
  *network-first* : toujours la donnée la plus fraîche si le réseau répond,
  sinon la dernière version connue) pour rester consultable en cas de coupure.
- Les **images produits** sont mises en cache 30 jours (*cache-first*).
- La **passation de commande** nécessite une connexion active en v1 (pas de
  file d'attente hors-ligne pour l'instant — prévu en v2 si besoin).

## Notes techniques

- **JWT fait main** (`backend/src/Auth/Jwt.php`) : implémentation HS256 sans
  dépendance externe (pas de Composer), pour rester déployable par simple
  upload FTP sur un hébergement mutualisé bon marché. Migration vers
  `firebase/php-jwt` triviale si vous préférez, plus tard.
- **Suppressions = désactivations** : catégories, produits et utilisateurs ne
  sont jamais supprimés en base (`DELETE`), seulement désactivés
  (`actif = 0`), pour préserver l'historique des commandes et mouvements de
  stock déjà liés.
- **Décrément de stock automatique** : géré dans `CommandeController::changerStatut()`.
  Le stock est décrémenté à l'entrée dans le statut `livree`, et recrédité
  si une commande quitte ce statut (annulation après livraison).
- **Build Node 18** : `vite-plugin-pwa` (via `workbox-build`) dépend d'un
  `crypto` global disponible nativement à partir de Node ≥ 19. Sous Node 18,
  lancez le build avec :
  ```bash
  NODE_OPTIONS=--experimental-global-webcrypto npm run build
  ```
  Sous Node ≥ 20, `npm run build` fonctionne directement sans cette variable.

## Roadmap v2 (architecture prévue, non codée)

- **Paiement en ligne** Wave / Orange Money : point d'intégration naturel dans
  `CommandeController` (statut de paiement à ajouter) et `NotificationManager`
  reste modulaire pour ajouter une confirmation de paiement.
- **Codes-barres** pour la saisie de stock : `StockController::creer()` accepte
  déjà un `produit_id` — il suffira d'ajouter une recherche produit par
  code-barres scanné côté frontend.
- **Notifications SMS / push** : ajouter une classe implémentant
  `NotificationChannel` (voir `src/Notifications/`) et l'enregistrer dans
  `NotificationManager` — aucun autre changement requis.
