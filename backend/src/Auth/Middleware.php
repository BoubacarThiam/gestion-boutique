<?php

namespace App\Auth;

use App\Core\Database;
use App\Core\Response;
use PDO;

/**
 * Vérifie le token JWT d'une requête et applique le contrôle des rôles.
 *
 *   $utilisateur = Middleware::authentifier();               // admin OU employé
 *   $utilisateur = Middleware::authentifier(['admin']);       // admin uniquement
 */
class Middleware
{
    /**
     * Vérifie le token Bearer, s'assure que l'utilisateur existe toujours
     * et est actif, puis (optionnellement) contrôle son rôle.
     * Interrompt la requête (401/403) si la vérification échoue.
     *
     * @param string[] $rolesAutorises Rôles autorisés ; vide = tout utilisateur connecté.
     * @return array{id:int, nom:string, telephone:string, role:string}
     */
    public static function authentifier(array $rolesAutorises = []): array
    {
        $token = self::extraireToken();
        if ($token === null) {
            Response::erreur('Authentification requise.', 401);
        }

        $payload = Jwt::decoder($token, config('jwt.secret'));
        if ($payload === null || !isset($payload['sub'])) {
            Response::erreur('Session invalide ou expirée, veuillez vous reconnecter.', 401);
        }

        // On revérifie en base que le compte existe toujours et est actif
        // (ex: un employé désactivé par l'admin ne doit plus pouvoir agir
        // même si son token n'est pas encore expiré).
        $pdo = Database::connexion();
        $requete = $pdo->prepare(
            'SELECT id, nom, telephone, role, actif FROM utilisateurs WHERE id = :id LIMIT 1'
        );
        $requete->execute(['id' => $payload['sub']]);
        $utilisateur = $requete->fetch(PDO::FETCH_ASSOC);

        if (!$utilisateur || (int) $utilisateur['actif'] !== 1) {
            Response::erreur('Compte introuvable ou désactivé.', 401);
        }

        if (!empty($rolesAutorises) && !in_array($utilisateur['role'], $rolesAutorises, true)) {
            Response::erreur('Vous n\'avez pas les droits nécessaires pour cette action.', 403);
        }

        unset($utilisateur['actif']);
        return $utilisateur;
    }

    private static function extraireToken(): ?string
    {
        $entete = null;

        if (function_exists('getallheaders')) {
            $entetes = getallheaders();
            $entete = $entetes['Authorization'] ?? $entetes['authorization'] ?? null;
        }

        // Repli pour les configurations Apache/FastCGI qui ne transmettent
        // pas l'en-tête via getallheaders()
        if ($entete === null) {
            $entete = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        }

        if ($entete === null || !str_starts_with($entete, 'Bearer ')) {
            return null;
        }

        return substr($entete, 7);
    }
}
