<?php

/**
 * Front controller : point d'entrée unique de l'API.
 * Toutes les requêtes HTTP arrivent ici (voir .htaccess) et sont
 * redirigées vers le bon contrôleur via le routeur.
 */

declare(strict_types=1);

// --- Autoloading -------------------------------------------------------
// Utilise vendor/autoload.php (Composer) s'il existe, sinon un autoloader
// PSR-4 minimaliste fait main : aucune dépendance n'est requise pour
// déployer ce backend (upload FTP simple sur hébergement mutualisé).
if (is_file(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} else {
    spl_autoload_register(function (string $classe): void {
        $prefixe = 'App\\';
        if (!str_starts_with($classe, $prefixe)) {
            return;
        }
        $cheminRelatif = str_replace('\\', '/', substr($classe, strlen($prefixe)));
        $fichier = __DIR__ . '/src/' . $cheminRelatif . '.php';
        if (is_file($fichier)) {
            require $fichier;
        }
    });
}

require __DIR__ . '/config/config.php';

use App\Controllers\AuthController;
use App\Controllers\CategorieController;
use App\Controllers\ClientController;
use App\Controllers\CommandeController;
use App\Controllers\DashboardController;
use App\Controllers\ProduitController;
use App\Controllers\PublicController;
use App\Controllers\RapportController;
use App\Controllers\StockController;
use App\Controllers\UtilisateurController;
use App\Core\Response;
use App\Core\Router;

// --- Gestion des erreurs -------------------------------------------------
// En prod, on ne veut jamais qu'un warning PHP casse la sortie JSON.
error_reporting(E_ALL);
ini_set('display_errors', '0');

set_exception_handler(function (Throwable $e): void {
    error_log('Exception non gérée : ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::erreur('Erreur interne du serveur.', 500);
});

// --- CORS ------------------------------------------------------------
$origineRequete = $_SERVER['HTTP_ORIGIN'] ?? '';
$originesAutorisees = config('cors.origines', []);

if (in_array('*', $originesAutorisees, true)) {
    header('Access-Control-Allow-Origin: *');
} elseif ($origineRequete !== '' && in_array($origineRequete, $originesAutorisees, true)) {
    header('Access-Control-Allow-Origin: ' . $origineRequete);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Déclaration des routes -------------------------------------------
$router = new Router();

// Authentification (gestion)
$router->post('/api/auth/login', [new AuthController(), 'login']);
$router->get('/api/auth/me', [new AuthController(), 'moi']);

// Catalogue public (aucune authentification)
$router->get('/api/public/parametres', [new PublicController(), 'parametres']);
$router->get('/api/public/categories', [new PublicController(), 'categories']);
$router->get('/api/public/produits', [new PublicController(), 'produits']);
$router->get('/api/public/produits/{id}', [new PublicController(), 'produit']);
$router->post('/api/public/commandes', [new CommandeController(), 'creerPublique']);

// Tableau de bord
$router->get('/api/dashboard', [new DashboardController(), 'index']);

// Catégories
$router->get('/api/categories', [new CategorieController(), 'index']);
$router->post('/api/categories', [new CategorieController(), 'creer']);
$router->put('/api/categories/{id}', [new CategorieController(), 'modifier']);
$router->delete('/api/categories/{id}', [new CategorieController(), 'supprimer']);

// Produits
$router->get('/api/produits', [new ProduitController(), 'index']);
$router->get('/api/produits/{id}', [new ProduitController(), 'show']);
$router->post('/api/produits', [new ProduitController(), 'creer']);
$router->put('/api/produits/{id}', [new ProduitController(), 'modifier']);
$router->post('/api/produits/{id}/image', [new ProduitController(), 'image']);
$router->delete('/api/produits/{id}', [new ProduitController(), 'supprimer']);

// Stock
$router->get('/api/stock/mouvements', [new StockController(), 'index']);
$router->post('/api/stock/mouvements', [new StockController(), 'creer']);
$router->get('/api/stock/alertes', [new StockController(), 'alertes']);

// Commandes (gestion)
$router->get('/api/commandes', [new CommandeController(), 'index']);
$router->get('/api/commandes/{id}', [new CommandeController(), 'show']);
$router->put('/api/commandes/{id}/statut', [new CommandeController(), 'changerStatut']);

// Clients
$router->get('/api/clients', [new ClientController(), 'index']);
$router->get('/api/clients/{id}', [new ClientController(), 'show']);

// Utilisateurs (admin uniquement, contrôlé dans le contrôleur)
$router->get('/api/utilisateurs', [new UtilisateurController(), 'index']);
$router->post('/api/utilisateurs', [new UtilisateurController(), 'creer']);
$router->put('/api/utilisateurs/{id}', [new UtilisateurController(), 'modifier']);
$router->delete('/api/utilisateurs/{id}', [new UtilisateurController(), 'supprimer']);

// Rapports (admin uniquement)
$router->get('/api/rapports/ventes', [new RapportController(), 'ventes']);
$router->get('/api/rapports/top-produits', [new RapportController(), 'topProduits']);
$router->get('/api/rapports/valeur-stock', [new RapportController(), 'valeurStock']);

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
