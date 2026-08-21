<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Rapports : ventes par période, produits les plus vendus, valeur du stock.
 * Réservé à l'admin (le propriétaire), comme précisé dans le cahier des charges.
 * Seules les commandes 'livree' comptent comme ventes réelles.
 */
class RapportController
{
    public function ventes(Request $request): void
    {
        Middleware::authentifier(['admin']);

        [$debut, $fin] = $this->periode($request);
        $pdo = Database::connexion();

        $requete = $pdo->prepare(
            "SELECT DATE(created_at) AS jour, COUNT(*) AS nombre_commandes, SUM(total) AS chiffre_affaires
             FROM commandes
             WHERE statut = 'livree' AND created_at BETWEEN :debut AND :fin
             GROUP BY DATE(created_at)
             ORDER BY jour ASC"
        );
        $requete->execute(['debut' => $debut, 'fin' => $fin]);
        $parJour = $requete->fetchAll(PDO::FETCH_ASSOC);

        $requeteTotal = $pdo->prepare(
            "SELECT COUNT(*) AS nombre_commandes, COALESCE(SUM(total), 0) AS chiffre_affaires
             FROM commandes WHERE statut = 'livree' AND created_at BETWEEN :debut AND :fin"
        );
        $requeteTotal->execute(['debut' => $debut, 'fin' => $fin]);

        Response::json([
            'periode' => ['debut' => $debut, 'fin' => $fin],
            'total'   => $requeteTotal->fetch(PDO::FETCH_ASSOC),
            'par_jour' => $parJour,
        ]);
    }

    public function topProduits(Request $request): void
    {
        Middleware::authentifier(['admin']);

        [$debut, $fin] = $this->periode($request);
        $limite = max(1, min(50, (int) $request->query('limite', 10)));
        $pdo = Database::connexion();

        $requete = $pdo->prepare(
            "SELECT p.id, p.nom, SUM(lc.quantite) AS quantite_vendue,
                    SUM(lc.quantite * lc.prix_unitaire) AS chiffre_affaires
             FROM lignes_commande lc
             JOIN commandes co ON co.id = lc.commande_id
             JOIN produits p ON p.id = lc.produit_id
             WHERE co.statut = 'livree' AND co.created_at BETWEEN :debut AND :fin
             GROUP BY p.id, p.nom
             ORDER BY quantite_vendue DESC
             LIMIT {$limite}"
        );
        $requete->execute(['debut' => $debut, 'fin' => $fin]);

        Response::json([
            'periode'  => ['debut' => $debut, 'fin' => $fin],
            'produits' => $requete->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    public function valeurStock(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $pdo = Database::connexion();
        $requete = $pdo->query(
            "SELECT
                COUNT(*) AS nombre_produits,
                COALESCE(SUM(quantite_stock), 0) AS unites_en_stock,
                COALESCE(SUM(quantite_stock * prix_achat), 0) AS valeur_achat,
                COALESCE(SUM(quantite_stock * prix_vente), 0) AS valeur_vente_potentielle
             FROM produits WHERE actif = 1"
        );

        Response::json(['valeur_stock' => $requete->fetch(PDO::FETCH_ASSOC)]);
    }

    /** @return array{0:string,1:string} [debut, fin] au format Y-m-d H:i:s, 30 derniers jours par défaut. */
    private function periode(Request $request): array
    {
        $debut = $request->query('debut') ? $request->query('debut') . ' 00:00:00' : date('Y-m-d 00:00:00', strtotime('-30 days'));
        $fin = $request->query('fin') ? $request->query('fin') . ' 23:59:59' : date('Y-m-d 23:59:59');
        return [$debut, $fin];
    }
}
