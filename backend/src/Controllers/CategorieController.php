<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Helpers\Validator;
use PDO;

/**
 * Gestion des catégories (Lunettes, Montres, Accessoires téléphone...).
 * Lecture : admin + employé. Écriture (créer/modifier/supprimer) : admin uniquement.
 */
class CategorieController
{
    public function index(Request $request): void
    {
        Middleware::authentifier(); // admin ou employé

        $pdo = Database::connexion();
        $categories = $pdo->query(
            'SELECT id, nom, description, actif, created_at FROM categories ORDER BY nom ASC'
        )->fetchAll(PDO::FETCH_ASSOC);

        Response::json(['categories' => $categories]);
    }

    public function creer(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['nom']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        $pdo = Database::connexion();
        $requete = $pdo->prepare(
            'INSERT INTO categories (nom, description, actif) VALUES (:nom, :description, :actif)'
        );
        $requete->execute([
            'nom'         => Validator::nettoyerChaine($donnees['nom']),
            'description' => isset($donnees['description']) ? Validator::nettoyerChaine($donnees['description']) : null,
            'actif'       => isset($donnees['actif']) ? (int) (bool) $donnees['actif'] : 1,
        ]);

        Response::json(['id' => (int) $pdo->lastInsertId('categories_id_seq')], 201);
    }

    public function modifier(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['nom']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        $pdo = Database::connexion();
        $requete = $pdo->prepare(
            'UPDATE categories SET nom = :nom, description = :description, actif = :actif WHERE id = :id'
        );
        $requete->execute([
            'nom'         => Validator::nettoyerChaine($donnees['nom']),
            'description' => isset($donnees['description']) ? Validator::nettoyerChaine($donnees['description']) : null,
            'actif'       => isset($donnees['actif']) ? (int) (bool) $donnees['actif'] : 1,
            'id'          => $id,
        ]);

        if ($requete->rowCount() === 0 && !self::existe($pdo, $id)) {
            Response::erreur('Catégorie introuvable.', 404);
        }

        Response::json(['message' => 'Catégorie mise à jour.']);
    }

    /**
     * "Suppression" = désactivation (actif = 0), pour ne jamais casser
     * l'historique des produits/commandes déjà liés à cette catégorie
     * (les produits restent en base avec categorie_id existant).
     */
    public function supprimer(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        $pdo = Database::connexion();

        if (!self::existe($pdo, $id)) {
            Response::erreur('Catégorie introuvable.', 404);
        }

        $requete = $pdo->prepare('UPDATE categories SET actif = 0 WHERE id = :id');
        $requete->execute(['id' => $id]);

        Response::json(['message' => 'Catégorie désactivée.']);
    }

    private static function existe(PDO $pdo, int $id): bool
    {
        $requete = $pdo->prepare('SELECT 1 FROM categories WHERE id = :id LIMIT 1');
        $requete->execute(['id' => $id]);
        return (bool) $requete->fetchColumn();
    }
}
