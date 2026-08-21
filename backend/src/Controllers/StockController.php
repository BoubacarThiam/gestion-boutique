<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Helpers\Validator;
use PDO;

/**
 * Entrées/sorties de stock. Accessible à l'admin ET à l'employé
 * (contrairement aux prix produits, réservés à l'admin).
 */
class StockController
{
    public function index(Request $request): void
    {
        Middleware::authentifier();

        $pdo = Database::connexion();
        $conditions = [];
        $params = [];

        if ($produitId = $request->query('produit_id')) {
            $conditions[] = 'm.produit_id = :produit_id';
            $params['produit_id'] = (int) $produitId;
        }

        if ($type = $request->query('type')) {
            $conditions[] = 'm.type = :type';
            $params['type'] = $type;
        }

        if ($debut = $request->query('debut')) {
            $conditions[] = 'm.created_at >= :debut';
            $params['debut'] = $debut . ' 00:00:00';
        }

        if ($fin = $request->query('fin')) {
            $conditions[] = 'm.created_at <= :fin';
            $params['fin'] = $fin . ' 23:59:59';
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $sql = "SELECT m.*, p.nom AS produit_nom, u.nom AS utilisateur_nom
                FROM mouvements_stock m
                JOIN produits p ON p.id = m.produit_id
                LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
                {$where}
                ORDER BY m.created_at DESC
                LIMIT 200";

        $requete = $pdo->prepare($sql);
        $requete->execute($params);

        Response::json(['mouvements' => $requete->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function creer(Request $request): void
    {
        $utilisateur = Middleware::authentifier(); // admin ou employé

        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['produit_id', 'type', 'quantite']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        $type = $donnees['type'];
        if (!in_array($type, ['entree', 'sortie'], true)) {
            Response::erreur('Type de mouvement invalide (entree ou sortie attendu).', 422);
        }

        $quantite = (int) $donnees['quantite'];
        if ($quantite <= 0) {
            Response::erreur('La quantité doit être supérieure à zéro.', 422);
        }

        $pdo = Database::connexion();
        $produitId = (int) $donnees['produit_id'];

        $pdo->beginTransaction();
        try {
            // SELECT ... FOR UPDATE pour éviter une situation de course si deux
            // mouvements sur le même produit arrivent en même temps.
            $requeteProduit = $pdo->prepare('SELECT id, quantite_stock FROM produits WHERE id = :id FOR UPDATE');
            $requeteProduit->execute(['id' => $produitId]);
            $produit = $requeteProduit->fetch(PDO::FETCH_ASSOC);

            if (!$produit) {
                $pdo->rollBack();
                Response::erreur('Produit introuvable.', 404);
            }

            if ($type === 'sortie' && $produit['quantite_stock'] < $quantite) {
                $pdo->rollBack();
                Response::erreur(
                    'Stock insuffisant : il reste ' . $produit['quantite_stock'] . ' unité(s).',
                    422
                );
            }

            $delta = $type === 'entree' ? $quantite : -$quantite;
            $pdo->prepare('UPDATE produits SET quantite_stock = quantite_stock + :delta WHERE id = :id')
                ->execute(['delta' => $delta, 'id' => $produitId]);

            $insertion = $pdo->prepare(
                'INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id)
                 VALUES (:produit_id, :type, :quantite, :motif, :utilisateur_id)'
            );
            $insertion->execute([
                'produit_id'     => $produitId,
                'type'           => $type,
                'quantite'       => $quantite,
                'motif'          => isset($donnees['motif']) ? Validator::nettoyerChaine($donnees['motif']) : null,
                'utilisateur_id' => $utilisateur['id'],
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('Erreur mouvement stock : ' . $e->getMessage());
            Response::erreur('Erreur lors de l\'enregistrement du mouvement.', 500);
        }

        Response::json(['message' => 'Mouvement enregistré.'], 201);
    }

    /** Produits dont le stock est à ou sous le seuil d'alerte. */
    public function alertes(Request $request): void
    {
        Middleware::authentifier();

        $pdo = Database::connexion();
        $produits = $pdo->query(
            "SELECT p.id, p.nom, p.quantite_stock, p.seuil_alerte, c.nom AS categorie_nom
             FROM produits p
             JOIN categories c ON c.id = p.categorie_id
             WHERE p.actif = 1 AND p.quantite_stock <= p.seuil_alerte
             ORDER BY p.quantite_stock ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        Response::json(['produits' => $produits]);
    }
}
