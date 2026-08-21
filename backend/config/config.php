<?php

/**
 * Point d'accès unique à la configuration de l'application.
 * Usage : config('db.host'), config('jwt.secret'), etc.
 */

use App\Core\Env;

Env::charger(__DIR__ . '/../.env');

/** @var array<string, mixed>|null $configCache */
$GLOBALS['__config'] = [
    'db' => [
        'host'    => Env::get('DB_HOST', 'localhost'),
        'port'    => Env::get('DB_PORT', '3306'),
        'nom'     => Env::get('DB_NAME', 'gestion_boutique'),
        'user'    => Env::get('DB_USER', 'root'),
        'pass'    => Env::get('DB_PASS', ''),
        'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    ],
    'jwt' => [
        'secret' => Env::get('JWT_SECRET', 'change_moi'),
        'expiry' => (int) Env::get('JWT_EXPIRY', 86400),
    ],
    'cors' => [
        'origines' => array_map('trim', explode(',', Env::get('CORS_ALLOWED_ORIGINS', '*'))),
    ],
    'app' => [
        'url' => rtrim(Env::get('APP_URL', 'http://localhost:8000'), '/'),
    ],
    'upload' => [
        'taille_max' => (int) Env::get('UPLOAD_MAX_SIZE', 2097152),
        'extensions_autorisees' => ['jpg', 'jpeg', 'png', 'webp'],
    ],
];

/**
 * Lit une valeur de configuration via une clé en notation pointée.
 * Ex : config('db.host'), config('jwt.expiry')
 */
function config(string $cle, mixed $defaut = null): mixed
{
    $segments = explode('.', $cle);
    $valeur = $GLOBALS['__config'];

    foreach ($segments as $segment) {
        if (!is_array($valeur) || !array_key_exists($segment, $valeur)) {
            return $defaut;
        }
        $valeur = $valeur[$segment];
    }

    return $valeur;
}
