<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Helpers\Validator;
use PDO;

/**
 * Gestion des produits (catalogue interne : lunettes, montres, accessoires).
 * Lecture : admin + employé. Créer/modifier/supprimer/prix : admin uniquement
 * (l'employé ajuste le stock via StockController, pas via ce contrôleur).
 */
class ProduitController
{
    public function index(Request $request): void
    {
        Middleware::authentifier();

        $pdo = Database::connexion();
        $conditions = [];
        $params = [];

        if ($request->query('actif') !== null) {
            $conditions[] = 'p.actif = :actif';
            $params['actif'] = (int) (bool) $request->query('actif');
        }

        if ($categorieId = $request->query('categorie_id')) {
            $conditions[] = 'p.categorie_id = :categorie_id';
            $params['categorie_id'] = (int) $categorieId;
        }

        if ($recherche = $request->query('q')) {
            $conditions[] = 'p.nom LIKE :recherche';
            $params['recherche'] = '%' . $recherche . '%';
        }

        if ($request->query('stock_bas')) {
            $conditions[] = 'p.quantite_stock <= p.seuil_alerte';
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $sql = "SELECT p.*, c.nom AS categorie_nom
                FROM produits p
                JOIN categories c ON c.id = p.categorie_id
                {$where}
                ORDER BY p.nom ASC";

        $requete = $pdo->prepare($sql);
        $requete->execute($params);

        Response::json(['produits' => $requete->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function show(Request $request): void
    {
        Middleware::authentifier();

        $produit = self::trouverOuEchouer((int) $request->param('id'));
        Response::json(['produit' => $produit]);
    }

    public function creer(Request $request): void
    {
        $utilisateur = Middleware::authentifier(['admin']);

        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['categorie_id', 'nom', 'prix_vente']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        $pdo = Database::connexion();

        if (!self::categorieExiste($pdo, (int) $donnees['categorie_id'])) {
            Response::erreur('Catégorie invalide.', 422, ['categorie_id' => 'Cette catégorie n\'existe pas.']);
        }

        $imageUrl = null;
        if ($fichier = $request->fichier('image')) {
            $imageUrl = self::enregistrerImage($fichier);
        }

        $requete = $pdo->prepare(
            'INSERT INTO produits
                (categorie_id, nom, description, prix_achat, prix_vente, quantite_stock, seuil_alerte, image_url, actif)
             VALUES
                (:categorie_id, :nom, :description, :prix_achat, :prix_vente, :quantite_stock, :seuil_alerte, :image_url, :actif)'
        );
        $requete->execute([
            'categorie_id'   => (int) $donnees['categorie_id'],
            'nom'            => Validator::nettoyerChaine($donnees['nom']),
            'description'    => isset($donnees['description']) ? Validator::nettoyerChaine($donnees['description']) : null,
            'prix_achat'     => (int) ($donnees['prix_achat'] ?? 0),
            'prix_vente'     => (int) $donnees['prix_vente'],
            'quantite_stock' => (int) ($donnees['quantite_stock'] ?? 0),
            'seuil_alerte'   => (int) ($donnees['seuil_alerte'] ?? 5),
            'image_url'      => $imageUrl,
            'actif'          => isset($donnees['actif']) ? (int) (bool) $donnees['actif'] : 1,
        ]);

        $id = (int) $pdo->lastInsertId('produits_id_seq');

        // Si un stock initial est fourni, on trace le mouvement d'entrée correspondant
        if ((int) ($donnees['quantite_stock'] ?? 0) > 0) {
            $utilisateur = Middleware::authentifier(['admin']);
            $mouv = $pdo->prepare(
                'INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id)
                 VALUES (:produit_id, \'entree\', :quantite, \'Stock initial\', :utilisateur_id)'
            );
            $mouv->execute([
                'produit_id'     => $id,
                'quantite'       => (int) $donnees['quantite_stock'],
                'utilisateur_id' => $utilisateur['id'],
            ]);
        }

        Response::json(['id' => $id], 201);
    }

    public function modifier(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        $produit = self::trouverOuEchouer($id);

        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['categorie_id', 'nom', 'prix_vente']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        $pdo = Database::connexion();

        if (!self::categorieExiste($pdo, (int) $donnees['categorie_id'])) {
            Response::erreur('Catégorie invalide.', 422, ['categorie_id' => 'Cette catégorie n\'existe pas.']);
        }

        // Important : la quantité de stock ne se modifie PAS ici, mais via
        // /api/stock/mouvements, pour garder un historique cohérent.
        $requete = $pdo->prepare(
            'UPDATE produits SET
                categorie_id = :categorie_id,
                nom = :nom,
                description = :description,
                prix_achat = :prix_achat,
                prix_vente = :prix_vente,
                seuil_alerte = :seuil_alerte,
                actif = :actif
             WHERE id = :id'
        );
        $requete->execute([
            'categorie_id' => (int) $donnees['categorie_id'],
            'nom'          => Validator::nettoyerChaine($donnees['nom']),
            'description'  => isset($donnees['description']) ? Validator::nettoyerChaine($donnees['description']) : null,
            'prix_achat'   => (int) ($donnees['prix_achat'] ?? $produit['prix_achat']),
            'prix_vente'   => (int) $donnees['prix_vente'],
            'seuil_alerte' => (int) ($donnees['seuil_alerte'] ?? $produit['seuil_alerte']),
            'actif'        => isset($donnees['actif']) ? (int) (bool) $donnees['actif'] : (int) $produit['actif'],
            'id'           => $id,
        ]);

        Response::json(['message' => 'Produit mis à jour.']);
    }

    /** Upload/remplacement de l'image d'un produit (multipart, endpoint dédié). */
    public function image(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        $produit = self::trouverOuEchouer($id);

        $fichier = $request->fichier('image');
        if (!$fichier) {
            Response::erreur('Aucune image reçue.', 422);
        }

        $nouvelleUrl = self::enregistrerImage($fichier);

        $pdo = Database::connexion();
        $requete = $pdo->prepare('UPDATE produits SET image_url = :image_url WHERE id = :id');
        $requete->execute(['image_url' => $nouvelleUrl, 'id' => $id]);

        // Nettoyage de l'ancienne image locale si elle existe
        if (!empty($produit['image_url']) && str_starts_with($produit['image_url'], '/uploads/')) {
            $ancienChemin = __DIR__ . '/../../' . ltrim($produit['image_url'], '/');
            if (is_file($ancienChemin)) {
                @unlink($ancienChemin);
            }
        }

        Response::json(['image_url' => $nouvelleUrl]);
    }

    /** "Suppression" = désactivation, pour préserver l'historique des commandes passées. */
    public function supprimer(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        self::trouverOuEchouer($id);

        $pdo = Database::connexion();
        $requete = $pdo->prepare('UPDATE produits SET actif = 0 WHERE id = :id');
        $requete->execute(['id' => $id]);

        Response::json(['message' => 'Produit désactivé.']);
    }

    private static function trouverOuEchouer(int $id): array
    {
        $pdo = Database::connexion();
        $requete = $pdo->prepare(
            'SELECT p.*, c.nom AS categorie_nom
             FROM produits p JOIN categories c ON c.id = p.categorie_id
             WHERE p.id = :id LIMIT 1'
        );
        $requete->execute(['id' => $id]);
        $produit = $requete->fetch(PDO::FETCH_ASSOC);

        if (!$produit) {
            Response::erreur('Produit introuvable.', 404);
        }

        return $produit;
    }

    private static function categorieExiste(PDO $pdo, int $id): bool
    {
        $requete = $pdo->prepare('SELECT 1 FROM categories WHERE id = :id LIMIT 1');
        $requete->execute(['id' => $id]);
        return (bool) $requete->fetchColumn();
    }

    /** Valide et enregistre un fichier uploadé dans uploads/produits/, retourne l'URL relative. */
    private static function enregistrerImage(array $fichier): string
    {
        if ($fichier['error'] !== UPLOAD_ERR_OK) {
            Response::erreur('Échec de l\'envoi de l\'image.', 422);
        }

        if ($fichier['size'] > config('upload.taille_max')) {
            Response::erreur('Image trop volumineuse (max 2 Mo).', 422);
        }

        $extension = strtolower(pathinfo($fichier['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, config('upload.extensions_autorisees'), true)) {
            Response::erreur('Format d\'image non autorisé (jpg, jpeg, png, webp uniquement).', 422);
        }

        // Vérifie que le fichier est bien une image (pas juste une extension trompeuse)
        if (@getimagesize($fichier['tmp_name']) === false) {
            Response::erreur('Le fichier envoyé n\'est pas une image valide.', 422);
        }

        $nomFichier = uniqid('produit_', true) . '.' . $extension;
        $dossier = __DIR__ . '/../../uploads/produits/';
        $cheminDestination = $dossier . $nomFichier;

        if (!move_uploaded_file($fichier['tmp_name'], $cheminDestination)) {
            Response::erreur('Impossible d\'enregistrer l\'image.', 500);
        }

        return '/uploads/produits/' . $nomFichier;
    }
}
