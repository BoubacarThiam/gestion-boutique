<?php

namespace App\Core;

/**
 * Petits helpers pour renvoyer des réponses JSON cohérentes dans toute l'API.
 */
class Response
{
    /** Réponse de succès. */
    public static function json(mixed $donnees = [], int $statut = 200): never
    {
        http_response_code($statut);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /** Réponse d'erreur au format { "erreur": "message", "details": {...}? } */
    public static function erreur(string $message, int $statut = 400, ?array $details = null): never
    {
        http_response_code($statut);
        header('Content-Type: application/json; charset=utf-8');
        $corps = ['erreur' => $message];
        if ($details !== null) {
            $corps['details'] = $details;
        }
        echo json_encode($corps, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
