<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Consultation des clients (créés automatiquement lors des commandes
 * publiques — pas de CRUD manuel, pas de compte client).
 */
class ClientController
{
    public function index(Request $request): void
    {
        Middleware::authentifier();

        $pdo = Database::connexion();
        $conditions = [];
        $params = [];

        if ($recherche = $request->query('q')) {
            $conditions[] = '(nom LIKE :recherche OR telephone LIKE :recherche)';
            $params['recherche'] = '%' . $recherche . '%';
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $sql = "SELECT c.*, (SELECT COUNT(*) FROM commandes WHERE client_id = c.id) AS nombre_commandes
                FROM clients c {$where}
                ORDER BY c.created_at DESC
                LIMIT 200";

        $requete = $pdo->prepare($sql);
        $requete->execute($params);

        Response::json(['clients' => $requete->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function show(Request $request): void
    {
        Middleware::authentifier();

        $id = (int) $request->param('id');
        $pdo = Database::connexion();

        $requete = $pdo->prepare('SELECT * FROM clients WHERE id = :id LIMIT 1');
        $requete->execute(['id' => $id]);
        $client = $requete->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            Response::erreur('Client introuvable.', 404);
        }

        $requeteCommandes = $pdo->prepare(
            'SELECT id, numero_commande, statut, total, created_at
             FROM commandes WHERE client_id = :id ORDER BY created_at DESC'
        );
        $requeteCommandes->execute(['id' => $id]);

        Response::json([
            'client'    => $client,
            'commandes' => $requeteCommandes->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }
}
