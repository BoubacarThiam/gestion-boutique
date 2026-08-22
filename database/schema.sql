-- =====================================================================
-- Base de données : gestion_boutique
-- Application de gestion de stock, commandes & livraison
-- Commerçant sénégalais (lunettes, montres, accessoires téléphone)
-- Moteur : MySQL / MariaDB — compatible hébergement mutualisé (cPanel)
--
-- Contenu de ce fichier :
--   1. Création de la base
--   2. Création des tables (structure)
--   3. Données de test (seed) : utilisateurs, catégories, produits,
--      mouvements de stock, clients, commandes
--
-- Import :
--   mysql -u <user> -p < schema.sql
--   (ou via phpMyAdmin sur l'hébergement mutualisé)
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS gestion_boutique
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestion_boutique;

-- =====================================================================
-- 1. STRUCTURE
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table : utilisateurs
-- Comptes internes : propriétaire (admin) et employés.
-- Les clients n'ont PAS de compte (voir table `clients`).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS utilisateurs;
CREATE TABLE utilisateurs (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom                 VARCHAR(100)    NOT NULL,
    telephone           VARCHAR(20)     NOT NULL,
    email               VARCHAR(150)    DEFAULT NULL,
    mot_de_passe_hash   VARCHAR(255)    NOT NULL,
    role                ENUM('admin','employe') NOT NULL DEFAULT 'employe',
    actif               TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_utilisateurs_telephone (telephone),
    UNIQUE KEY uq_utilisateurs_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : categories
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100)    NOT NULL,
    description TEXT            DEFAULT NULL,
    actif       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_categories_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : produits
-- Prix en FCFA (XOF) : pas de sous-unité -> entiers non signés.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS produits;
CREATE TABLE produits (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categorie_id    INT UNSIGNED    NOT NULL,
    nom             VARCHAR(150)    NOT NULL,
    description     TEXT            DEFAULT NULL,
    prix_achat      INT UNSIGNED    NOT NULL DEFAULT 0,
    prix_vente      INT UNSIGNED    NOT NULL,
    quantite_stock  INT             NOT NULL DEFAULT 0,
    seuil_alerte    INT UNSIGNED    NOT NULL DEFAULT 5,
    image_url       VARCHAR(255)    DEFAULT NULL,
    actif           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produits_categorie FOREIGN KEY (categorie_id)
        REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    KEY idx_produits_categorie (categorie_id),
    KEY idx_produits_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : mouvements_stock
-- Historique des entrées/sorties de stock (saisies manuelles ou
-- générées automatiquement lors d'une livraison / annulation).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS mouvements_stock;
CREATE TABLE mouvements_stock (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produit_id      INT UNSIGNED    NOT NULL,
    type            ENUM('entree','sortie') NOT NULL,
    quantite        INT UNSIGNED    NOT NULL,
    motif           VARCHAR(255)    DEFAULT NULL,
    utilisateur_id  INT UNSIGNED    DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mouvements_produit FOREIGN KEY (produit_id)
        REFERENCES produits(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mouvements_utilisateur FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateurs(id) ON DELETE SET NULL ON UPDATE CASCADE,
    KEY idx_mouvements_produit (produit_id),
    KEY idx_mouvements_type (type),
    KEY idx_mouvements_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : clients
-- Créés/retrouvés (par téléphone) au moment de la commande publique.
-- Pas d'authentification.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(150)    NOT NULL,
    telephone   VARCHAR(20)     NOT NULL,
    adresse     VARCHAR(255)    DEFAULT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_clients_telephone (telephone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : commandes
-- `numero_commande` = référence lisible affichée au client
-- (ex: CMD-20260821-0001), générée côté application.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS commandes;
CREATE TABLE commandes (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_commande     VARCHAR(30)     NOT NULL,
    client_id           INT UNSIGNED    NOT NULL,
    statut              ENUM('nouvelle','en_preparation','livree','annulee')
                                         NOT NULL DEFAULT 'nouvelle',
    total               INT UNSIGNED    NOT NULL DEFAULT 0,
    adresse_livraison   VARCHAR(255)    NOT NULL,
    note                TEXT            DEFAULT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_commandes_numero (numero_commande),
    CONSTRAINT fk_commandes_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    KEY idx_commandes_statut (statut),
    KEY idx_commandes_client (client_id),
    KEY idx_commandes_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : lignes_commande
-- `prix_unitaire` est figé au moment de la commande (historique des prix
-- préservé même si `produits.prix_vente` change ensuite).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS lignes_commande;
CREATE TABLE lignes_commande (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    commande_id     INT UNSIGNED    NOT NULL,
    produit_id      INT UNSIGNED    NOT NULL,
    quantite        INT UNSIGNED    NOT NULL,
    prix_unitaire   INT UNSIGNED    NOT NULL,
    CONSTRAINT fk_lignes_commande FOREIGN KEY (commande_id)
        REFERENCES commandes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lignes_produit FOREIGN KEY (produit_id)
        REFERENCES produits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    KEY idx_lignes_commande (commande_id),
    KEY idx_lignes_produit (produit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : parametres
-- Réglages modifiables par l'admin sans toucher au code : nom de la
-- boutique, numéro WhatsApp du propriétaire pour les alertes, etc.
-- Clé/valeur pour rester extensible (v2 : Wave/OM, SMS...).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS parametres;
CREATE TABLE parametres (
    cle     VARCHAR(100) PRIMARY KEY,
    valeur  TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. DONNÉES DE TEST (SEED)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paramètres de la boutique
-- ---------------------------------------------------------------------
INSERT INTO parametres (cle, valeur) VALUES
    ('nom_boutique', 'Teranga Style Boutique'),
    ('whatsapp_proprietaire', '221771234567'),
    ('adresse_boutique', 'Marché Sandaga, Dakar'),
    ('devise', 'FCFA');

-- ---------------------------------------------------------------------
-- Utilisateurs
-- Mot de passe admin   : admin123
-- Mot de passe employé : employe123
-- (hash bcrypt généré via password_hash() — à changer en production)
-- ---------------------------------------------------------------------
INSERT INTO utilisateurs (nom, telephone, email, mot_de_passe_hash, role, actif) VALUES
    ('Modou Ba',      '221771234567', 'modou.ba@example.sn',     '$2y$10$hzlvSEJ0Mzwi5XmycqajSeScOLauKd8bXpsb43o4Kaog61sPBHJ/K', 'admin',  1),
    ('Awa Ndiaye',    '221781112233', 'awa.ndiaye@example.sn',   '$2y$10$jJiO06fLNPbsXQM0h9FOv.wSRs8HK7HtSiXIXYxZem6xRb6FIkupu', 'employe', 1);

-- ---------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------
INSERT INTO categories (id, nom, description, actif) VALUES
    (1, 'Lunettes',               'Lunettes de soleil et de vue, toutes marques', 1),
    (2, 'Montres',                'Montres homme, femme et enfant', 1),
    (3, 'Accessoires téléphone',  'Coques, chargeurs, écouteurs, câbles, etc.', 1);

-- ---------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------
INSERT INTO produits (id, categorie_id, nom, description, prix_achat, prix_vente, quantite_stock, seuil_alerte, image_url, actif) VALUES
    (1, 1, 'Lunettes de soleil Aviator',        'Monture métal, verres polarisés',              4000,  8500, 19, 5, NULL, 1),
    (2, 1, 'Lunettes de soleil Wayfarer',       'Monture plastique, style classique',           3500,  7500, 15, 5, NULL, 1),
    (3, 1, 'Lunettes de vue anti-lumière bleue','Protection écrans, monture légère',            3000,  6500,  8, 5, NULL, 1),
    -- Remplacées par le vrai arrivage montres (photos réelles, 21/08/2026) —
    -- id conservés (4/5/6) car référencés par la commande de démo #2 plus bas.
    (4, 2, 'Montre squelette dorée cuir marron',  'Cadran effet squelette blanc/or, bracelet cuir marron',   7500, 15000, 3, 1, '/uploads/produits/produit_montre01.jpeg', 1),
    (5, 2, 'Montre squelette or cuir marron',     'Cadran effet squelette doré, bracelet cuir marron',       7500, 15000, 3, 1, '/uploads/produits/produit_montre02.jpeg', 1),
    (6, 2, 'Montre squelette bleue acier',        'Cadran effet squelette bleu, bracelet acier argenté',     7500, 15000, 3, 1, '/uploads/produits/produit_montre03.jpeg', 1),
    (7, 3, 'Coque silicone iPhone',             'Coque antichoc, plusieurs coloris',             800,  2000, 34, 10, NULL, 1),
    (8, 3, 'Chargeur rapide type-C 20W',        'Chargeur secteur + câble',                     2000,  4500, 25, 8, NULL, 1),
    (9, 3, 'Écouteurs Bluetooth',               'Sans fil, autonomie 6h',                       4000,  9000,  5, 5, NULL, 1),
    (10, 3, 'Câble USB renforcé 1m',            'Câble tressé, charge + données',                800,  2000, 30, 10, NULL, 1),
    -- Arrivage lunettes (photos vitrine réelles, 21/08/2026) — pièces uniques,
    -- stock volontairement faible (3 par modèle).
    (11, 1, 'Lunette de soleil ronde noire',          'Monture ronde brillante, verres dégradés gris',    4000, 8000, 3, 1, '/uploads/produits/produit_lunette01.jpeg', 1),
    (12, 1, 'Lunette de soleil carrée noire',         'Monture épaisse, verres fumés',                    4000, 8000, 3, 1, '/uploads/produits/produit_lunette02.jpeg', 1),
    (13, 1, 'Lunette de soleil carrée écaille',       'Style rétro, verres marron',                       4000, 8000, 3, 1, '/uploads/produits/produit_lunette03.jpeg', 1),
    (14, 1, 'Lunette de soleil ronde noire brillante','Monture ronde, verres fumés foncés',                4000, 8000, 3, 1, '/uploads/produits/produit_lunette04.jpeg', 1),
    (15, 1, 'Lunette de soleil papillon bleu marine', 'Monture papillon, branches métal fines',           4000, 8000, 3, 1, '/uploads/produits/produit_lunette05.jpeg', 1),
    (16, 1, 'Lunette de soleil carrée écaille marron','Monture épaisse vernie',                           4000, 8000, 3, 1, '/uploads/produits/produit_lunette06.jpeg', 1),
    (17, 1, 'Lunette de soleil hexagonale grise',     'Monture translucide, détails dorés',               4000, 8000, 3, 1, '/uploads/produits/produit_lunette07.jpeg', 1),
    (18, 1, 'Lunette de soleil carrée rivets dorés',  'Monture noire épaisse, finitions dorées',          4000, 8000, 3, 1, '/uploads/produits/produit_lunette08.jpeg', 1),
    (19, 1, 'Lunette de soleil hexagonale dorée',     'Monture métal fine, verres fumés',                 4000, 8000, 3, 1, '/uploads/produits/produit_lunette09.jpeg', 1),
    (20, 1, 'Lunette de soleil carrée écaille noire', 'Monture noire, branches écaille contrastées',      4000, 8000, 3, 1, '/uploads/produits/produit_lunette10.jpeg', 1),
    (21, 1, 'Lunette de soleil ronde vintage',        'Monture écaille arrondie, style rétro',            4000, 8000, 3, 1, '/uploads/produits/produit_lunette11.jpeg', 1),
    (22, 1, 'Lunette de soleil aviateur carrée',      'Monture métal noire, détail corne',                4000, 8000, 3, 1, '/uploads/produits/produit_lunette12.jpeg', 1),
    (23, 1, 'Lunette de soleil ronde transparente',   'Monture claire, verres bicolores',                 4000, 8000, 3, 1, '/uploads/produits/produit_lunette13.jpeg', 1),
    -- Arrivage montres (photos vitrine réelles, 21/08/2026, suite — 3 des 6
    -- photos ont remplacé les montres de démo 4/5/6 ci-dessus).
    (24, 2, 'Montre squelette verte acier doré',      'Cadran effet squelette vert, bracelet acier bicolore',      7500, 15000, 3, 1, '/uploads/produits/produit_montre04.jpeg', 1),
    (25, 2, 'Montre squelette blanche acier doré',    'Cadran effet squelette blanc/or, bracelet acier bicolore',  7500, 15000, 3, 1, '/uploads/produits/produit_montre05.jpeg', 1),
    (26, 2, 'Montre squelette blanche acier argenté', 'Cadran effet squelette blanc, bracelet acier argenté',      7500, 15000, 3, 1, '/uploads/produits/produit_montre06.jpeg', 1),
    -- Arrivage lunettes #2 (photos vitrine réelles, 22/08/2026).
    (27, 1, 'Lunette de soleil ronde écaille marron',    'Monture ronde noire, branches écaille marron',        6000, 12000, 3, 1, '/uploads/produits/produit_lunette14.jpeg', 1),
    (28, 1, 'Lunette de soleil rectangulaire ambrée',    'Monture transparente, branches ambrées',              6000, 12000, 3, 1, '/uploads/produits/produit_lunette15.jpeg', 1),
    (29, 1, 'Lunette de soleil ronde noire argentée',    'Monture ronde, charnières argentées',                 6000, 12000, 3, 1, '/uploads/produits/produit_lunette16.jpeg', 1),
    (30, 1, 'Lunette de soleil carrée bronze métal',     'Monture métal bronze, branches fines',                6000, 12000, 3, 1, '/uploads/produits/produit_lunette17.jpeg', 1),
    (31, 1, 'Lunette de soleil ronde grise fumée',       'Monture translucide grise, verres fumés',             6000, 12000, 3, 1, '/uploads/produits/produit_lunette18.jpeg', 1),
    (32, 1, 'Lunette de soleil carrée noire épaisse',    'Monture épaisse, verres fumés',                       6000, 12000, 3, 1, '/uploads/produits/produit_lunette19.jpeg', 1),
    (33, 1, 'Lunette de soleil papillon grise bleutée',  'Monture métal grise, verres teintés bleu',            6000, 12000, 3, 1, '/uploads/produits/produit_lunette20.jpeg', 1),
    (34, 1, 'Lunette de soleil hexagonale transparente', 'Monture claire, verres teintés bleu',                 6000, 12000, 3, 1, '/uploads/produits/produit_lunette21.jpeg', 1),
    (35, 1, 'Lunette de vue ronde grise',                'Monture translucide grise, verres clairs',            6000, 12000, 3, 1, '/uploads/produits/produit_lunette22.jpeg', 1),
    -- Arrivage lunettes #3 : gamme "original" sans monture (photos vitrine
    -- réelles, 22/08/2026), verres polycarbonate, tarif plus premium.
    (36, 1, 'Lunette sans monture grise branches dorées',   'Sans cerclage, verres polycarbonate fumés, branches dorées',       17000, 35000, 3, 1, '/uploads/produits/produit_lunette23.jpeg', 1),
    (37, 1, 'Lunette sans monture dégradée branches bois',  'Sans cerclage, verres polycarbonate dégradés, branches bois',      17000, 35000, 3, 1, '/uploads/produits/produit_lunette24.jpeg', 1),
    (38, 1, 'Lunette sans monture claire pont doré',        'Sans cerclage, verres polycarbonate clairs, pont doré',            17000, 35000, 3, 1, '/uploads/produits/produit_lunette25.jpeg', 1),
    (39, 1, 'Lunette sans monture fumée branches noires',   'Sans cerclage, verres polycarbonate fumés, branches noires',       17000, 35000, 3, 1, '/uploads/produits/produit_lunette26.jpeg', 1),
    (40, 1, 'Lunette sans monture carrée strass dorés',     'Sans cerclage, verres polycarbonate carrés, charnières strass',    17000, 35000, 3, 1, '/uploads/produits/produit_lunette27.jpeg', 1),
    (41, 1, 'Lunette sans monture rectangulaire argentée',  'Sans cerclage, verres polycarbonate, charnières argentées',        17000, 35000, 3, 1, '/uploads/produits/produit_lunette28.jpeg', 1),
    (42, 1, 'Lunette sans monture grise charnières ornées', 'Sans cerclage, verres polycarbonate, charnières dorées ornées',    17000, 35000, 3, 1, '/uploads/produits/produit_lunette29.jpeg', 1),
    -- Gamme SALCIR (photos déjà présentes dans uploads/produits — utilisées
    -- jusqu'ici seulement pour l'animation vitrine de la catégorie Montres,
    -- transformées ici en vraies fiches produit achetables). 2 photos du lot
    -- volontairement exclues : le collage marketing "Hardlex dial..." (texte
    -- publicitaire visible dessus, pas une photo produit) et la version
    -- "gold skeleton cuir marron" quasi identique au produit 5 déjà en base.
    (43, 2, 'Montre bleue bracelet cuir',              'Cadran bleu, bracelet cuir bleu',                     6000, 12000, 3, 1, '/uploads/produits/produit_salcir_01_1787317483a.jpeg', 1),
    (44, 2, 'Montre chronographe bleue',               'Cadran bleu à compteurs, bracelet silicone',          6000, 12000, 3, 1, '/uploads/produits/produit_salcir_02_1787317483b.jpeg', 1),
    (45, 2, 'Montre plongée verte',                    'Cadran vert, bracelet nato vert',                     6000, 12000, 3, 1, '/uploads/produits/produit_salcir_03_1787317483c.jpeg', 1),
    (46, 2, 'Montre classique argent et or',            'Cadran bicolore, bracelet cuir marron',               6000, 12000, 3, 1, '/uploads/produits/produit_salcir_04_1787317483d.jpeg', 1),
    (47, 2, 'Montre classique bleu marine',             'Cadran bleu marine, bracelet cuir noir',              6000, 12000, 3, 1, '/uploads/produits/produit_salcir_05_1787317483e.jpeg', 1),
    (48, 2, 'Montre dorée cadran arabe',                'Cadran doré chiffres arabes, bracelet acier doré',    6000, 12000, 3, 1, '/uploads/produits/produit_salcir_06_1787317483f.jpeg', 1),
    (49, 2, 'Montre argentée cadran arabe',             'Cadran argenté chiffres arabes, bracelet acier',      6000, 12000, 3, 1, '/uploads/produits/produit_salcir_07_1787317483g.jpeg', 1),
    (50, 2, 'Montre bicolore cadran arabe',             'Cadran noir chiffres arabes, bracelet acier bicolore',6000, 12000, 3, 1, '/uploads/produits/produit_salcir_08_1787317483h.jpeg', 1),
    (51, 2, 'Montre verte cadran nervuré',              'Cadran vert nervuré, bracelet acier',                 6000, 12000, 3, 1, '/uploads/produits/produit_salcir_10_1787317483j.jpeg', 1);

-- ---------------------------------------------------------------------
-- Mouvements de stock (entrées initiales correspondant au stock ci-dessus)
-- ---------------------------------------------------------------------
INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id) VALUES
    (1,  'entree', 20, 'Stock initial', 1),
    (2,  'entree', 15, 'Stock initial', 1),
    (3,  'entree', 8,  'Stock initial', 1),
    (4,  'entree', 3,  'Stock initial', 1),
    (5,  'entree', 3,  'Stock initial', 1),
    (6,  'entree', 6,  'Stock initial', 1),
    (6,  'sortie', 3,  'Vente comptoir',  2),
    (7,  'entree', 40, 'Stock initial', 1),
    (8,  'entree', 25, 'Stock initial', 1),
    (9,  'entree', 5,  'Stock initial', 1),
    (10, 'entree', 30, 'Stock initial', 1),
    (1,  'sortie', 1,  'Livraison commande CMD-20260819-0001', 2),
    (7,  'sortie', 6,  'Livraison commande CMD-20260819-0001', 2),
    (11, 'entree', 3,  'Stock initial', 1),
    (12, 'entree', 3,  'Stock initial', 1),
    (13, 'entree', 3,  'Stock initial', 1),
    (14, 'entree', 3,  'Stock initial', 1),
    (15, 'entree', 3,  'Stock initial', 1),
    (16, 'entree', 3,  'Stock initial', 1),
    (17, 'entree', 3,  'Stock initial', 1),
    (18, 'entree', 3,  'Stock initial', 1),
    (19, 'entree', 3,  'Stock initial', 1),
    (20, 'entree', 3,  'Stock initial', 1),
    (21, 'entree', 3,  'Stock initial', 1),
    (22, 'entree', 3,  'Stock initial', 1),
    (23, 'entree', 3,  'Stock initial', 1),
    (24, 'entree', 3,  'Stock initial', 1),
    (25, 'entree', 3,  'Stock initial', 1),
    (26, 'entree', 3,  'Stock initial', 1),
    (27, 'entree', 3,  'Stock initial', 1),
    (28, 'entree', 3,  'Stock initial', 1),
    (29, 'entree', 3,  'Stock initial', 1),
    (30, 'entree', 3,  'Stock initial', 1),
    (31, 'entree', 3,  'Stock initial', 1),
    (32, 'entree', 3,  'Stock initial', 1),
    (33, 'entree', 3,  'Stock initial', 1),
    (34, 'entree', 3,  'Stock initial', 1),
    (35, 'entree', 3,  'Stock initial', 1),
    (36, 'entree', 3,  'Stock initial', 1),
    (37, 'entree', 3,  'Stock initial', 1),
    (38, 'entree', 3,  'Stock initial', 1),
    (39, 'entree', 3,  'Stock initial', 1),
    (40, 'entree', 3,  'Stock initial', 1),
    (41, 'entree', 3,  'Stock initial', 1),
    (42, 'entree', 3,  'Stock initial', 1),
    (43, 'entree', 3,  'Stock initial', 1),
    (44, 'entree', 3,  'Stock initial', 1),
    (45, 'entree', 3,  'Stock initial', 1),
    (46, 'entree', 3,  'Stock initial', 1),
    (47, 'entree', 3,  'Stock initial', 1),
    (48, 'entree', 3,  'Stock initial', 1),
    (49, 'entree', 3,  'Stock initial', 1),
    (50, 'entree', 3,  'Stock initial', 1),
    (51, 'entree', 3,  'Stock initial', 1);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
INSERT INTO clients (id, nom, telephone, adresse) VALUES
    (1, 'Fatou Sarr',   '221765554433', 'Cité Keur Gorgui, Dakar'),
    (2, 'Ibrahima Diop','221709998877', 'Parcelles Assainies, Unité 15');

-- ---------------------------------------------------------------------
-- Commandes + lignes de commande
-- ---------------------------------------------------------------------
INSERT INTO commandes (id, numero_commande, client_id, statut, total, adresse_livraison, note) VALUES
    (1, 'CMD-20260819-0001', 1, 'livree',        20500, 'Cité Keur Gorgui, Dakar',       'Livrer après 17h si possible'),
    (2, 'CMD-20260820-0001', 2, 'nouvelle',      16000, 'Parcelles Assainies, Unité 15', NULL);

INSERT INTO lignes_commande (commande_id, produit_id, quantite, prix_unitaire) VALUES
    (1, 1, 1, 8500),   -- Lunettes Aviator            (1 * 8500  = 8500)
    (1, 7, 6, 2000),   -- Coques silicone iPhone      (6 * 2000  = 12000) -> total commande 1 = 20500
    (2, 4, 1, 12000),  -- Montre squelette dorée cuir marron (prix historique de la commande, avant le changement de tarif du produit)
    (2, 10, 2, 2000);  -- Câbles USB renforcés        (2 * 2000  = 4000)  -> total commande 2 = 16000

-- Remarque : la commande #1 est déjà 'livree' dans ce seed, avec ses
-- mouvements 'sortie' correspondants déjà insérés ci-dessus et le stock
-- des produits 1 et 7 déjà décrémenté en conséquence. En conditions
-- réelles, c'est l'API qui génère automatiquement ces mouvements et ce
-- décrément au moment où une commande passe au statut 'livree' (Phase 3).
-- La commande #2 est encore 'nouvelle' : son stock n'est donc pas
-- (encore) décrémenté.

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Fin du script
-- =====================================================================
