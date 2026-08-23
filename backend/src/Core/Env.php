<?php

namespace App\Core;

/**
 * Chargeur minimaliste de fichier .env (aucune dépendance externe,
 * pour rester déployable par simple upload FTP sur hébergement mutualisé).
 */
class Env
{
    private static bool $charge = false;

    public static function charger(string $chemin): void
    {
        if (self::$charge || !is_file($chemin)) {
            self::$charge = true;
            return;
        }

        $lignes = file($chemin, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lignes as $ligne) {
            $ligne = trim($ligne);

            // Ignore les commentaires et lignes vides
            if ($ligne === '' || str_starts_with($ligne, '#')) {
                continue;
            }

            if (!str_contains($ligne, '=')) {
                continue;
            }

            [$cle, $valeur] = explode('=', $ligne, 2);
            $cle = trim($cle);
            $valeur = trim($valeur);

            // Retire les guillemets englobants éventuels
            if (strlen($valeur) >= 2 && $valeur[0] === '"' && str_ends_with($valeur, '"')) {
                $valeur = substr($valeur, 1, -1);
            }

            putenv("{$cle}={$valeur}");
            $_ENV[$cle] = $valeur;
        }

        self::$charge = true;
    }

    public static function get(string $cle, mixed $defaut = null): mixed
    {
        // $_ENV d'abord : sur certains hébergements mutualisés (ex.
        // InfinityFree), putenv() est dans disable_functions et n'a donc
        // aucun effet — charger() peuple quand même $_ENV (simple tableau
        // PHP, jamais restreint), donc c'est la source fiable. getenv()
        // reste en repli pour les variables définies au niveau serveur
        // (hors .env), qui elles n'apparaissent pas forcément dans $_ENV.
        if (array_key_exists($cle, $_ENV)) {
            return $_ENV[$cle];
        }

        $valeur = getenv($cle);
        return $valeur === false ? $defaut : $valeur;
    }
}
