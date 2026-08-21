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
    (4, 2, 'Montre homme cuir noir',            'Bracelet cuir, quartz, résistante à l''eau',   6000, 12000, 10, 3, NULL, 1),
    (5, 2, 'Montre femme dorée',                'Bracelet acier doré, cadran strass',           5500, 11000,  7, 3, NULL, 1),
    (6, 2, 'Montre sport digitale',             'Étanche, chronomètre, rétroéclairage',         4500,  9500,  2, 3, NULL, 1),
    (7, 3, 'Coque silicone iPhone',             'Coque antichoc, plusieurs coloris',             800,  2000, 34, 10, NULL, 1),
    (8, 3, 'Chargeur rapide type-C 20W',        'Chargeur secteur + câble',                     2000,  4500, 25, 8, NULL, 1),
    (9, 3, 'Écouteurs Bluetooth',               'Sans fil, autonomie 6h',                       4000,  9000,  5, 5, NULL, 1),
    (10, 3, 'Câble USB renforcé 1m',            'Câble tressé, charge + données',                800,  2000, 30, 10, NULL, 1);

-- ---------------------------------------------------------------------
-- Mouvements de stock (entrées initiales correspondant au stock ci-dessus)
-- ---------------------------------------------------------------------
INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id) VALUES
    (1,  'entree', 20, 'Stock initial', 1),
    (2,  'entree', 15, 'Stock initial', 1),
    (3,  'entree', 8,  'Stock initial', 1),
    (4,  'entree', 10, 'Stock initial', 1),
    (5,  'entree', 7,  'Stock initial', 1),
    (6,  'entree', 5,  'Stock initial', 1),
    (6,  'sortie', 3,  'Vente comptoir',  2),
    (7,  'entree', 40, 'Stock initial', 1),
    (8,  'entree', 25, 'Stock initial', 1),
    (9,  'entree', 5,  'Stock initial', 1),
    (10, 'entree', 30, 'Stock initial', 1),
    (1,  'sortie', 1,  'Livraison commande CMD-20260819-0001', 2),
    (7,  'sortie', 6,  'Livraison commande CMD-20260819-0001', 2);

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
    (2, 4, 1, 12000),  -- Montre homme cuir noir      (1 * 12000 = 12000)
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
