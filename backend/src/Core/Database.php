<?php

namespace App\Core;

use PDO;
use PDOException;

/**
 * Connexion PDO unique (singleton) à MySQL/MariaDB ou PostgreSQL (Supabase),
 * selon DB_DRIVER dans .env. Toutes les requêtes de l'application passent
 * par des requêtes préparées.
 */
class Database
{
    private static ?PDO $instance = null;

    public static function connexion(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $pilote = config('db.driver', 'mysql');

        $dsn = $pilote === 'pgsql'
            ? \sprintf(
                'pgsql:host=%s;port=%s;dbname=%s',
                config('db.host'),
                config('db.port'),
                config('db.nom')
            )
            : \sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                config('db.host'),
                config('db.port'),
                config('db.nom'),
                config('db.charset')
            );

        try {
            self::$instance = new PDO($dsn, config('db.user'), config('db.pass'), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // On ne renvoie jamais le message d'erreur PDO brut au client (peut contenir des identifiants)
            error_log('Erreur connexion BDD : ' . $e->getMessage());
            Response::erreur('Erreur de connexion à la base de données.', 500);
        }

        return self::$instance;
    }
}
