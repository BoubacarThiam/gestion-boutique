<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Tableau de bord : nouvelles commandes (notification "in-app"), produits en
 * stock bas, ventes du jour et chiffre d'affaires. Accessible admin + employé.
 */
class DashboardController
{
    public function index(Request $request): void
    {
        Middleware::authentifier();

        $pdo = Database::connexion();

        // Nouvelles commandes = la "notification in-app" du cahier des charges :
        // pas de table dédiée, juste les commandes au statut 'nouvelle'.
        $nouvellesCommandes = $pdo->query(
            "SELECT co.id, co.numero_commande, co.total, co.created_at, cl.nom AS client_nom, cl.telephone AS client_telephone
             FROM commandes co JOIN clients cl ON cl.id = co.client_id
             WHERE co.statut = 'nouvelle'
             ORDER BY co.created_at DESC"
        )->fetchAll(PDO::FETCH_ASSOC);

        $produitsStockBas = $pdo->query(
            "SELECT id, nom, quantite_stock, seuil_alerte
             FROM produits WHERE actif = 1 AND quantite_stock <= seuil_alerte
             ORDER BY quantite_stock ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        $venteDuJour = $pdo->query(
            "SELECT COUNT(*) AS nombre_commandes, COALESCE(SUM(total), 0) AS chiffre_affaires
             FROM commandes WHERE statut = 'livree' AND DATE(created_at) = CURDATE()"
        )->fetch(PDO::FETCH_ASSOC);

        $commandesEnCours = $pdo->query(
            "SELECT COUNT(*) FROM commandes WHERE statut IN ('nouvelle', 'en_preparation')"
        )->fetchColumn();

        Response::json([
            'nouvelles_commandes' => [
                'nombre' => count($nouvellesCommandes),
                'liste'  => $nouvellesCommandes,
            ],
            'stock_bas' => [
                'nombre' => count($produitsStockBas),
                'liste'  => $produitsStockBas,
            ],
            'ventes_du_jour'     => $venteDuJour,
            'commandes_en_cours' => (int) $commandesEnCours,
        ]);
    }
}
