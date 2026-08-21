<?php

namespace App\Helpers;

/**
 * Petites fonctions de validation réutilisées par les contrôleurs.
 * Ne lève pas d'exception : retourne un tableau d'erreurs (vide = OK),
 * à charge du contrôleur de répondre avec Response::erreur(..., 422, $erreurs).
 */
class Validator
{
    /**
     * Vérifie que chaque champ listé est présent et non vide dans $donnees.
     * @param string[] $champsObligatoires
     * @return array<string, string> champ => message d'erreur
     */
    public static function requis(array $donnees, array $champsObligatoires): array
    {
        $erreurs = [];
        foreach ($champsObligatoires as $champ) {
            $valeur = $donnees[$champ] ?? null;
            if ($valeur === null || $valeur === '' || (is_string($valeur) && trim($valeur) === '')) {
                $erreurs[$champ] = "Le champ « {$champ} » est obligatoire.";
            }
        }
        return $erreurs;
    }

    public static function estEntierPositif(mixed $valeur): bool
    {
        return is_numeric($valeur) && (int) $valeur >= 0 && (string) (int) $valeur === (string) $valeur;
    }

    public static function estNumerique(mixed $valeur): bool
    {
        return is_numeric($valeur);
    }

    public static function estTelephoneValide(mixed $valeur): bool
    {
        // Accepte les formats sénégalais courants : 77xxxxxxx, 221771234567, +221771234567...
        return is_string($valeur) && preg_match('/^\+?[0-9]{8,15}$/', trim($valeur)) === 1;
    }

    public static function nettoyerChaine(mixed $valeur): string
    {
        return trim(strip_tags((string) $valeur));
    }
}
