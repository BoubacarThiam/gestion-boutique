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
- [Déploiement Vercel + Railway + Supabase](#déploiement-vercel--railway--supabase-gratuit)
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
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS gestion_boutique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p gestion_boutique < database/schema.sql
```

La première commande crée la base, la seconde ses tables et des données de
test (catégories, produits, un admin, un employé, quelques commandes).
`schema.sql` ne crée pas la base lui-même : sur un hébergement mutualisé
(InfinityFree, cPanel...), la base est déjà créée par l'hébergeur et votre
utilisateur MySQL n'a généralement pas le droit d'en créer une autre —
importez-le directement dans la base existante via phpMyAdmin (onglet
*Import*).

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

## Déploiement (Vercel + Railway + Supabase, gratuit)

Alternative moderne à l'hébergement mutualisé ci-dessus : frontend sur
**Vercel**, API sur **Railway**, base de données sur **Supabase**
(PostgreSQL — plus simple à initialiser que MySQL sur Railway : tout se
fait dans l'éditeur SQL web de Supabase, sans ligne de commande). Nécessite
un compte sur chacun des trois (gratuits pour démarrer) — les trois se
connectent directement au dépôt GitHub, chaque `git push` redéploie
automatiquement (sauf Supabase, qui n'a pas de code à redéployer).

### 1. Supabase — base de données

1. Sur [supabase.com](https://supabase.com), *New Project* — notez le mot
   de passe base de données que vous choisissez à la création (il ne sera
   plus jamais affiché en clair ensuite).
2. Menu de gauche **SQL Editor → New query** : ouvrez
   `database/schema.postgres.sql` de ce dépôt, collez tout son contenu,
   **Run**. Ce fichier contient la même structure et les mêmes données que
   `database/schema.sql` (MySQL), juste en syntaxe PostgreSQL — voir
   [Notes techniques](#notes-techniques).
3. **Settings → Database → Connection string** : copiez la chaîne
   **Session pooler** (port `5432` — pas *Transaction pooler*/`6543` : le
   backend fait de vraies requêtes préparées PDO et utilise
   `lastInsertId()`, qui ont besoin d'une connexion stable le temps d'une
   requête HTTP, ce que le mode transaction du pooler ne garantit pas).
   Format : `postgresql://postgres.<ref-projet>:<mot-de-passe>@aws-x-region.pooler.supabase.com:5432/postgres`
   — le `User` à retenir est `postgres.<ref-projet>` en entier (pas juste
   `postgres`). Avec le mot de passe choisi à l'étape 1, ce sont les 5
   valeurs `DB_*` à utiliser à l'étape suivante.

### 2. Railway — API

1. Sur [railway.app](https://railway.app), *New Project* → **Deploy from
   GitHub repo** → sélectionnez ce dépôt.
2. Sur le service créé depuis le dépôt : **Settings → Root Directory** =
   `backend` (c'est là que se trouve le `Dockerfile`, détecté automatiquement).
3. **Settings → Volumes** : ajoutez un volume monté sur `/var/www/html/uploads/produits`
   — sans ça, les photos ajoutées depuis l'admin seraient perdues à chaque
   redéploiement. Le volume est vide au premier démarrage : `docker-entrypoint.sh`
   y recopie automatiquement les photos déjà présentes dans l'image (voir
   [Notes techniques](#notes-techniques)).
4. **Variables** du service API (valeurs `DB_*` notées à l'étape Supabase
   1.3) :
   ```
   DB_DRIVER=pgsql
   DB_HOST=<host du pooler Supabase, ex. aws-1-eu-west-1.pooler.supabase.com>
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres.<ref-projet Supabase>
   DB_PASS=<mot de passe Supabase>
   JWT_SECRET=<généré avec php -r "echo bin2hex(random_bytes(32));">
   CORS_ALLOWED_ORIGINS=https://<votre-projet>.vercel.app
   APP_URL=https://<url-publique-railway-du-service>
   ```
5. **Settings → Networking → Generate Domain** pour obtenir l'URL publique
   de l'API (ex: `gestion-boutique-api.up.railway.app`).

### 3. Vercel — frontend

1. Sur [vercel.com](https://vercel.com), *Add New → Project* → importez
   ce dépôt.
2. **Root Directory** = `frontend`. Framework détecté automatiquement
   (Vite) ; build command et output (`dist/`) n'ont rien à changer.
3. **Environment Variables** :
   ```
   VITE_API_URL=https://<url-publique-railway-de-l'étape-2.5>
   ```
4. *Deploy*. Redéployez (ou déclenchez un nouveau déploiement) si vous
   changez `VITE_API_URL` après coup — les variables d'env sont figées au
   moment du build côté Vite.

### Après déploiement

Mêmes étapes que pour l'hébergement mutualisé : changez les mots de passe
de démo (page **Utilisateurs**) et les infos de la table `parametres`.

### Ça ne marche toujours pas ?

Dans l'ordre, les points de blocage les plus fréquents :
- **Schéma pas importé** : sur Supabase, *Table Editor* doit lister
  `produits`, `commandes`, etc. Si c'est vide, refaites l'étape 1.2.
- **`DB_DRIVER=pgsql` oublié** sur Railway (défaut = `mysql`, la connexion
  à Supabase échoue silencieusement sinon).
- **`VITE_API_URL` sans le bon domaine**, ou changé sans redéployer Vercel
  après coup (la valeur est figée au build).
- **`CORS_ALLOWED_ORIGINS`** sur Railway qui ne correspond pas exactement
  à l'URL Vercel (avec `https://`, sans `/` final).
- Logs à regarder en premier en cas d'erreur : Railway → *Deployments* →
  le déploiement → logs ; Vercel → *Deployments* → le déploiement →
  *Build Logs* / *Function Logs*.

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
  `crypto` global disponible nativement à partir de Node ≥ 19. Le script
  `npm run build` définit déjà `NODE_OPTIONS=--experimental-global-webcrypto`
  pour que ça fonctionne aussi sous Node 18 sans étape manuelle (inoffensif
  sous Node ≥ 20, qui a `crypto` nativement).
- **MySQL et PostgreSQL supportés** (`backend/src/Core/Database.php`) : le
  pilote PDO se choisit via `DB_DRIVER` (`mysql` par défaut, ou `pgsql` pour
  Supabase — voir [Déploiement Vercel + Railway + Supabase](#déploiement-vercel--railway--supabase-gratuit)).
  Les deux schémas (`database/schema.sql` et `database/schema.postgres.sql`)
  contiennent exactement les mêmes tables et les mêmes données de test,
  juste écrits dans la syntaxe DDL de chaque moteur (`AUTO_INCREMENT` vs
  `SERIAL`, `ENUM` vs `CHECK`, etc.). Pas de dépendance à une lib d'ORM :
  seuls les 5 appels à `PDO::lastInsertId()` de l'application passent le nom
  de la séquence Postgres correspondante (ignoré par le pilote MySQL, donc
  sans effet en local).

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
