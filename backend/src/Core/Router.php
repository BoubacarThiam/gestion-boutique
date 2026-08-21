<?php

namespace App\Core;

/**
 * Routeur minimaliste : associe une méthode HTTP + un chemin (avec
 * paramètres {id}) à un callable. Pas de dépendance externe.
 */
class Router
{
    /** @var array<int, array{methode:string, regex:string, params:string[], handler:callable}> */
    private array $routes = [];

    public function get(string $chemin, callable $handler): void
    {
        $this->ajouter('GET', $chemin, $handler);
    }

    public function post(string $chemin, callable $handler): void
    {
        $this->ajouter('POST', $chemin, $handler);
    }

    public function put(string $chemin, callable $handler): void
    {
        $this->ajouter('PUT', $chemin, $handler);
    }

    public function delete(string $chemin, callable $handler): void
    {
        $this->ajouter('DELETE', $chemin, $handler);
    }

    private function ajouter(string $methode, string $chemin, callable $handler): void
    {
        $noms = [];
        // Convertit /produits/{id} en regex #^/produits/(?<id>[^/]+)$#
        $regex = preg_replace_callback('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', function ($m) use (&$noms) {
            $noms[] = $m[1];
            return '(?<' . $m[1] . '>[^/]+)';
        }, $chemin);

        $this->routes[] = [
            'methode' => $methode,
            'regex'   => '#^' . $regex . '$#',
            'params'  => $noms,
            'handler' => $handler,
        ];
    }

    /**
     * Fait correspondre la requête courante à une route et exécute son handler.
     * Envoie une 404 ou 405 si rien ne correspond.
     */
    public function dispatch(string $methode, string $uri): void
    {
        $uri = parse_url($uri, PHP_URL_PATH) ?: '/';
        $uri = rtrim($uri, '/');
        if ($uri === '') {
            $uri = '/';
        }

        $cheminExisteAvecAutreMethode = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $uri, $matches)) {
                continue;
            }

            if ($route['methode'] !== $methode) {
                $cheminExisteAvecAutreMethode = true;
                continue;
            }

            $request = new Request();
            foreach ($route['params'] as $nom) {
                $request->params[$nom] = $matches[$nom];
            }

            ($route['handler'])($request);
            return;
        }

        if ($cheminExisteAvecAutreMethode) {
            Response::erreur('Méthode non autorisée pour cette ressource.', 405);
        }

        Response::erreur('Ressource introuvable.', 404);
    }
}
