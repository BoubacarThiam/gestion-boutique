# Déploiement InfinityFree

Hébergement mutualisé gratuit : PHP + MySQL + fichiers statiques dans un
seul compte, un seul dossier `htdocs/`. Le frontend (build Vite) et le
backend cohabitent donc dans le même domaine — plus simple à câbler
qu'un sous-domaine séparé (qui peut prendre jusqu'à 72h à se propager
côté DNS sur InfinityFree).

## Structure sur le serveur

```
htdocs/
├── index.html, assets/, sw.js, ...   ← contenu de frontend/dist/
├── .htaccess                          ← deploy/infinityfree/htaccess-racine
└── backend/
    ├── index.php, config/, src/, uploads/, .htaccess   ← contenu de backend/
    │                                                       (SAUF .env*, Dockerfile,
    │                                                       .dockerignore, docker-entrypoint.sh,
    │                                                       composer.json — inutiles ici)
    └── .env                           ← créé à la main, voir ci-dessous
```

`deploy/infinityfree/htaccess-racine` route `/api/...` et `/uploads/...`
vers `backend/`, le reste vers `index.html` (SPA React Router). Il inclut
aussi le correctif de l'en-tête `Authorization` (voir plus bas).

## Procédure

1. **Base de données** — Control Panel InfinityFree → *MySQL Databases* →
   créer une base, noter `NOM D'UTILISATEUR MYSQL` / `MOT DE PASSE` /
   `NOM D'HÔTE MYSQL` (ex: `sql101.infinityfree.com`) / nom complet de la
   base (ex: `if0_XXXXX_boutique`).
2. **Importer le schéma** — phpMyAdmin (bouton à côté de la base dans le
   Control Panel) → onglet *Import* → choisir `database/schema.sql`
   (version MySQL, pas `schema.postgres.sql`) → Exécuter.
3. **Build frontend** :
   ```bash
   cd frontend && npm run build
   ```
4. **`.env` de production** (à créer, ne PAS committer) :
   ```
   DB_DRIVER=mysql
   DB_HOST=<hôte MySQL InfinityFree>
   DB_PORT=3306
   DB_NAME=<nom complet de la base>
   DB_USER=<utilisateur MySQL>
   DB_PASS=<mot de passe MySQL>
   DB_CHARSET=utf8mb4
   JWT_SECRET=<généré avec php -r "echo bin2hex(random_bytes(32));">
   JWT_EXPIRY=86400
   CORS_ALLOWED_ORIGINS=https://<ton-domaine>
   APP_URL=https://<ton-domaine>
   UPLOAD_MAX_SIZE=2097152
   ```
5. **Upload FTP** (identifiants dans Control Panel → *FTP Accounts*,
   host généralement `ftpupload.net`) :
   - contenu de `frontend/dist/` → `htdocs/`
   - `deploy/infinityfree/htaccess-racine` → `htdocs/.htaccess` (remplace
     celui généré par le build Vite)
   - contenu de `backend/` (sauf les fichiers listés plus haut) →
     `htdocs/backend/`
   - le `.env` de l'étape 4 → `htdocs/backend/.env`

## Pièges déjà rencontrés (et corrigés dans le code)

- **`#1044 Accès refusé`** à l'import du schéma : `database/schema.sql`
  ne doit pas contenir `CREATE DATABASE` / `USE` — la base existe déjà et
  l'utilisateur MySQL mutualisé n'a pas le droit d'en créer une autre.
  Déjà retiré du fichier.
- **Page blanche après connexion** (mais catalogue public OK) : Apache ne
  transmet pas l'en-tête `Authorization` à PHP par défaut sur beaucoup
  d'hébergements mutualisés → toute requête authentifiée échoue en 401
  ("Authentification requise"), et l'app plante en tentant d'afficher des
  données jamais arrivées. Corrigé par la règle `RewriteRule .* -
  [E=HTTP_AUTHORIZATION:...]` déjà présente dans `backend/.htaccess` et
  dans `deploy/infinityfree/htaccess-racine`.
- **Page de vérification anti-robot InfinityFree** sur un premier accès
  direct (curl, requête isolée) : normal, propre à leur hébergement
  gratuit, n'affecte pas une navigation réelle au navigateur.
