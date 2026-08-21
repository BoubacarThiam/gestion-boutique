<?php

namespace App\Controllers;

use App\Auth\Jwt;
use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Helpers\Validator;
use PDO;

/**
 * Authentification des comptes internes (admin / employé).
 * Les clients n'ont pas de compte, donc pas de "register" public ici.
 */
class AuthController
{
    public function login(Request $request): void
    {
        $donnees = $request->all();

        $erreurs = Validator::requis($donnees, ['telephone', 'mot_de_passe']);
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        $telephone = Validator::nettoyerChaine($donnees['telephone']);

        $pdo = Database::connexion();
        $requete = $pdo->prepare(
            'SELECT id, nom, telephone, email, mot_de_passe_hash, role, actif
             FROM utilisateurs WHERE telephone = :telephone LIMIT 1'
        );
        $requete->execute(['telephone' => $telephone]);
        $utilisateur = $requete->fetch(PDO::FETCH_ASSOC);

        if (!$utilisateur || (int) $utilisateur['actif'] !== 1) {
            Response::erreur('Identifiants incorrects.', 401);
        }

        if (!password_verify((string) $donnees['mot_de_passe'], $utilisateur['mot_de_passe_hash'])) {
            Response::erreur('Identifiants incorrects.', 401);
        }

        $token = Jwt::encoder(
            ['sub' => $utilisateur['id'], 'role' => $utilisateur['role'], 'nom' => $utilisateur['nom']],
            config('jwt.secret'),
            config('jwt.expiry')
        );

        unset($utilisateur['mot_de_passe_hash'], $utilisateur['actif']);

        Response::json([
            'token'       => $token,
            'utilisateur' => $utilisateur,
        ]);
    }

    public function moi(Request $request): void
    {
        $utilisateur = Middleware::authentifier();
        Response::json(['utilisateur' => $utilisateur]);
    }
}
