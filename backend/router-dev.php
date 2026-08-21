<?php

/**
 * Routeur utilisé UNIQUEMENT avec le serveur de développement intégré de PHP :
 *   php -S localhost:8000 router-dev.php
 *
 * En production (Apache), c'est le fichier .htaccess qui joue ce rôle
 * (laisser passer les fichiers réels comme /uploads/..., router le reste
 * vers index.php). Le serveur de dev de PHP ne lit pas les .htaccess,
 * d'où ce petit script équivalent, pour que le comportement soit identique
 * en local et en production.
 */

$chemin = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$fichier = __DIR__ . $chemin;

if ($chemin !== '/' && is_file($fichier)) {
    return false; // laisse le serveur PHP servir le fichier statique tel quel
}

require __DIR__ . '/index.php';
