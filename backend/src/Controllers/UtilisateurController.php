<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Helpers\Validator;
use PDO;

/**
 * Gestion des comptes internes (admin / employé). Réservé au rôle admin,
 * de bout en bout — un employé n'a accès à aucune méthode de ce contrôleur.
 */
class UtilisateurController
{
    public function index(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $pdo = Database::connexion();
        $utilisateurs = $pdo->query(
            'SELECT id, nom, telephone, email, role, actif, created_at FROM utilisateurs ORDER BY nom ASC'
        )->fetchAll(PDO::FETCH_ASSOC);

        Response::json(['utilisateurs' => $utilisateurs]);
    }

    public function creer(Request $request): void
    {
        Middleware::authentifier(['admin']);

        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['nom', 'telephone', 'mot_de_passe', 'role']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        if (!in_array($donnees['role'], ['admin', 'employe'], true)) {
            Response::erreur('Rôle invalide.', 422, ['role' => 'admin ou employe attendu.']);
        }

        if (strlen((string) $donnees['mot_de_passe']) < 6) {
            Response::erreur('Mot de passe trop court (6 caractères minimum).', 422);
        }

        $pdo = Database::connexion();

        $verifTel = $pdo->prepare('SELECT 1 FROM utilisateurs WHERE telephone = :telephone LIMIT 1');
        $verifTel->execute(['telephone' => $donnees['telephone']]);
        if ($verifTel->fetchColumn()) {
            Response::erreur('Ce numéro de téléphone est déjà utilisé.', 422, ['telephone' => 'Déjà utilisé.']);
        }

        $requete = $pdo->prepare(
            'INSERT INTO utilisateurs (nom, telephone, email, mot_de_passe_hash, role, actif)
             VALUES (:nom, :telephone, :email, :hash, :role, :actif)'
        );
        $requete->execute([
            'nom'       => Validator::nettoyerChaine($donnees['nom']),
            'telephone' => Validator::nettoyerChaine($donnees['telephone']),
            'email'     => !empty($donnees['email']) ? Validator::nettoyerChaine($donnees['email']) : null,
            'hash'      => password_hash((string) $donnees['mot_de_passe'], PASSWORD_BCRYPT),
            'role'      => $donnees['role'],
            'actif'     => isset($donnees['actif']) ? (int) (bool) $donnees['actif'] : 1,
        ]);

        Response::json(['id' => (int) $pdo->lastInsertId('utilisateurs_id_seq')], 201);
    }

    public function modifier(Request $request): void
    {
        $admin = Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        $pdo = Database::connexion();

        $requeteExistant = $pdo->prepare('SELECT * FROM utilisateurs WHERE id = :id LIMIT 1');
        $requeteExistant->execute(['id' => $id]);
        $existant = $requeteExistant->fetch(PDO::FETCH_ASSOC);
        if (!$existant) {
            Response::erreur('Utilisateur introuvable.', 404);
        }

        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['nom', 'telephone', 'role']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        if (!in_array($donnees['role'], ['admin', 'employe'], true)) {
            Response::erreur('Rôle invalide.', 422);
        }

        // Un admin ne peut pas se rétrograder / se désactiver lui-même
        // (protection contre le "je me bloque tout seul l'accès").
        if ($id === $admin['id'] && ($donnees['role'] !== 'admin' || (isset($donnees['actif']) && !(bool) $donnees['actif']))) {
            Response::erreur('Vous ne pouvez pas modifier votre propre rôle ou vous désactiver vous-même.', 422);
        }

        $champs = [
            'nom'       => Validator::nettoyerChaine($donnees['nom']),
            'telephone' => Validator::nettoyerChaine($donnees['telephone']),
            'email'     => !empty($donnees['email']) ? Validator::nettoyerChaine($donnees['email']) : null,
            'role'      => $donnees['role'],
            'actif'     => isset($donnees['actif']) ? (int) (bool) $donnees['actif'] : (int) $existant['actif'],
            'id'        => $id,
        ];

        $sqlMotDePasse = '';
        if (!empty($donnees['mot_de_passe'])) {
            if (strlen((string) $donnees['mot_de_passe']) < 6) {
                Response::erreur('Mot de passe trop court (6 caractères minimum).', 422);
            }
            $sqlMotDePasse = ', mot_de_passe_hash = :hash';
            $champs['hash'] = password_hash((string) $donnees['mot_de_passe'], PASSWORD_BCRYPT);
        }

        $requete = $pdo->prepare(
            "UPDATE utilisateurs SET nom = :nom, telephone = :telephone, email = :email,
                role = :role, actif = :actif {$sqlMotDePasse}
             WHERE id = :id"
        );
        $requete->execute($champs);

        Response::json(['message' => 'Utilisateur mis à jour.']);
    }

    /** "Suppression" = désactivation (actif = 0), pour garder l'historique des mouvements de stock. */
    public function supprimer(Request $request): void
    {
        $admin = Middleware::authentifier(['admin']);

        $id = (int) $request->param('id');
        if ($id === $admin['id']) {
            Response::erreur('Vous ne pouvez pas désactiver votre propre compte.', 422);
        }

        $pdo = Database::connexion();
        $requete = $pdo->prepare('UPDATE utilisateurs SET actif = 0 WHERE id = :id');
        $requete->execute(['id' => $id]);

        if ($requete->rowCount() === 0) {
            Response::erreur('Utilisateur introuvable.', 404);
        }

        Response::json(['message' => 'Utilisateur désactivé.']);
    }
}
