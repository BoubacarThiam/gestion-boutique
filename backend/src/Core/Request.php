<?php

namespace App\Core;

/**
 * Encapsule les données d'une requête HTTP entrante :
 * corps JSON, paramètres de requête (?query=), fichiers uploadés.
 */
class Request
{
    private array $donnees;
    private array $query;
    /** @var array<string, mixed> paramètres extraits de l'URL (ex: {id}) */
    public array $params = [];

    public function __construct()
    {
        $this->query = $_GET ?? [];

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $brut = file_get_contents('php://input');
            $this->donnees = $brut ? (json_decode($brut, true) ?? []) : [];
        } else {
            // multipart/form-data (upload de fichiers) ou x-www-form-urlencoded
            $this->donnees = $_POST ?? [];
        }
    }

    /** Récupère un champ du corps de la requête (JSON ou form-data). */
    public function input(string $cle, mixed $defaut = null): mixed
    {
        return $this->donnees[$cle] ?? $defaut;
    }

    /** Tout le corps de la requête. */
    public function all(): array
    {
        return $this->donnees;
    }

    /** Récupère un paramètre de query string (?cle=valeur). */
    public function query(string $cle, mixed $defaut = null): mixed
    {
        return $this->query[$cle] ?? $defaut;
    }

    /** Récupère un fichier uploadé ($_FILES['image'] par ex.), ou null. */
    public function fichier(string $cle): ?array
    {
        if (!isset($_FILES[$cle]) || $_FILES[$cle]['error'] === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        return $_FILES[$cle];
    }

    /** Récupère un paramètre d'URL (ex: /produits/{id} -> params['id']). */
    public function param(string $cle, mixed $defaut = null): mixed
    {
        return $this->params[$cle] ?? $defaut;
    }
}
