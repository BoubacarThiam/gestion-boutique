<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Endpoints publics du catalogue (aucune authentification requise).
 * Ne renvoie jamais les catégories/produits désactivés (actif = 0).
 */
class PublicController
{
    /**
     * Réglages publics d'affichage (nom, adresse). Le numéro WhatsApp du
     * propriétaire reste volontairement privé : il n'est utilisé que côté
     * serveur pour générer le lien d'alerte affiché à l'admin.
     */
    public function parametres(Request $request): void
    {
        $pdo = Database::connexion();
        $requete = $pdo->query("SELECT cle, valeur FROM parametres WHERE cle IN ('nom_boutique', 'adresse_boutique', 'devise')");

        $parametres = [];
        foreach ($requete->fetchAll(PDO::FETCH_ASSOC) as $ligne) {
            $parametres[$ligne['cle']] = $ligne['valeur'];
        }

        Response::json(['parametres' => $parametres]);
    }

    public function categories(Request $request): void
    {
        $pdo = Database::connexion();
        $categories = $pdo->query(
            "SELECT id, nom, description FROM categories WHERE actif = 1 ORDER BY nom ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        Response::json(['categories' => $categories]);
    }

    public function produits(Request $request): void
    {
        $pdo = Database::connexion();

        $conditions = ['p.actif = 1'];
        $params = [];

        if ($categorieId = $request->query('categorie_id')) {
            $conditions[] = 'p.categorie_id = :categorie_id';
            $params['categorie_id'] = (int) $categorieId;
        }

        if ($recherche = $request->query('q')) {
            $conditions[] = 'p.nom LIKE :recherche';
            $params['recherche'] = '%' . $recherche . '%';
        }

        $sql = 'SELECT p.id, p.nom, p.description, p.prix_vente, p.image_url, p.categorie_id, c.nom AS categorie_nom
                FROM produits p
                JOIN categories c ON c.id = p.categorie_id
                WHERE ' . implode(' AND ', $conditions) . '
                ORDER BY p.nom ASC';

        $requete = $pdo->prepare($sql);
        $requete->execute($params);

        Response::json(['produits' => $requete->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function produit(Request $request): void
    {
        $id = (int) $request->param('id');

        $pdo = Database::connexion();
        $requete = $pdo->prepare(
            'SELECT p.id, p.nom, p.description, p.prix_vente, p.image_url, p.categorie_id, c.nom AS categorie_nom
             FROM produits p
             JOIN categories c ON c.id = p.categorie_id
             WHERE p.id = :id AND p.actif = 1
             LIMIT 1'
        );
        $requete->execute(['id' => $id]);
        $produit = $requete->fetch(PDO::FETCH_ASSOC);

        if (!$produit) {
            Response::erreur('Produit introuvable.', 404);
        }

        Response::json(['produit' => $produit]);
    }
}
