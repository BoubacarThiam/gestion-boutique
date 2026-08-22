<?php

namespace App\Controllers;

use App\Auth\Middleware;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Helpers\Validator;
use App\Notifications\NotificationManager;
use PDO;

/**
 * Commandes clients : création publique (sans compte) côté catalogue,
 * puis gestion (liste, détail, changement de statut) côté admin/employé.
 *
 * Règle de stock : le stock n'est décrémenté/recrédité QUE lors du
 * changement de statut vers/depuis 'livree' (voir changerStatut()), jamais
 * à la création de la commande.
 */
class CommandeController
{
    private const STATUTS_VALIDES = ['nouvelle', 'en_preparation', 'livree', 'annulee'];

    /** POST /api/public/commandes — accessible sans authentification. */
    public function creerPublique(Request $request): void
    {
        $donnees = $request->all();
        $erreurs = Validator::requis($donnees, ['nom', 'telephone', 'adresse_livraison', 'lignes']);

        if (!isset($erreurs['lignes']) && (!is_array($donnees['lignes'] ?? null) || count($donnees['lignes']) === 0)) {
            $erreurs['lignes'] = 'Le panier est vide.';
        }
        if (!empty($erreurs)) {
            Response::erreur('Champs manquants.', 422, $erreurs);
        }

        if (!Validator::estTelephoneValide($donnees['telephone'])) {
            Response::erreur('Numéro de téléphone invalide.', 422, ['telephone' => 'Format invalide.']);
        }

        $pdo = Database::connexion();

        // Recharge chaque produit depuis la BDD : on ne fait jamais confiance
        // au prix envoyé par le navigateur.
        $lignesValidees = [];
        foreach ($donnees['lignes'] as $ligneEntree) {
            $produitId = (int) ($ligneEntree['produit_id'] ?? 0);
            $quantite = (int) ($ligneEntree['quantite'] ?? 0);

            if ($produitId <= 0 || $quantite <= 0) {
                Response::erreur('Ligne de commande invalide.', 422);
            }

            $requete = $pdo->prepare('SELECT id, nom, prix_vente FROM produits WHERE id = :id AND actif = 1 LIMIT 1');
            $requete->execute(['id' => $produitId]);
            $produit = $requete->fetch(PDO::FETCH_ASSOC);

            if (!$produit) {
                Response::erreur("Un des produits du panier n'est plus disponible.", 422);
            }

            $lignesValidees[] = [
                'produit_id'    => $produit['id'],
                'nom_produit'   => $produit['nom'],
                'quantite'      => $quantite,
                'prix_unitaire' => (int) $produit['prix_vente'],
            ];
        }

        $total = array_sum(array_map(fn($l) => $l['quantite'] * $l['prix_unitaire'], $lignesValidees));

        $nom = Validator::nettoyerChaine($donnees['nom']);
        $telephone = Validator::nettoyerChaine($donnees['telephone']);
        $adresseLivraison = Validator::nettoyerChaine($donnees['adresse_livraison']);
        $note = isset($donnees['note']) ? Validator::nettoyerChaine($donnees['note']) : null;

        $pdo->beginTransaction();
        try {
            // Client retrouvé par téléphone, sinon créé. Les infos sont
            // rafraîchies avec les dernières valeurs saisies.
            $requeteClient = $pdo->prepare('SELECT id FROM clients WHERE telephone = :telephone LIMIT 1');
            $requeteClient->execute(['telephone' => $telephone]);
            $clientId = $requeteClient->fetchColumn();

            if ($clientId) {
                $pdo->prepare('UPDATE clients SET nom = :nom, adresse = :adresse WHERE id = :id')
                    ->execute(['nom' => $nom, 'adresse' => $adresseLivraison, 'id' => $clientId]);
            } else {
                $pdo->prepare('INSERT INTO clients (nom, telephone, adresse) VALUES (:nom, :telephone, :adresse)')
                    ->execute(['nom' => $nom, 'telephone' => $telephone, 'adresse' => $adresseLivraison]);
                // Nom de séquence en argument : ignoré par le pilote MySQL,
                // requis par PDO_PGSQL (Postgres n'a pas d'équivalent
                // implicite à MySQL pour "le dernier id inséré").
                $clientId = (int) $pdo->lastInsertId('clients_id_seq');
            }

            $numeroCommande = $this->genererNumeroCommande($pdo);

            $pdo->prepare(
                'INSERT INTO commandes (numero_commande, client_id, statut, total, adresse_livraison, note)
                 VALUES (:numero, :client_id, \'nouvelle\', :total, :adresse, :note)'
            )->execute([
                'numero'  => $numeroCommande,
                'client_id' => $clientId,
                'total'   => $total,
                'adresse' => $adresseLivraison,
                'note'    => $note,
            ]);
            $commandeId = (int) $pdo->lastInsertId('commandes_id_seq');

            $insertLigne = $pdo->prepare(
                'INSERT INTO lignes_commande (commande_id, produit_id, quantite, prix_unitaire)
                 VALUES (:commande_id, :produit_id, :quantite, :prix_unitaire)'
            );
            foreach ($lignesValidees as $ligne) {
                $insertLigne->execute([
                    'commande_id'   => $commandeId,
                    'produit_id'    => $ligne['produit_id'],
                    'quantite'      => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('Erreur création commande : ' . $e->getMessage());
            Response::erreur('Impossible d\'enregistrer la commande, veuillez réessayer.', 500);
        }

        Response::json([
            'message'         => 'Commande enregistrée avec succès.',
            'numero_commande' => $numeroCommande,
            'total'           => $total,
        ], 201);
    }

    /** GET /api/commandes — admin + employé, filtrable par statut. */
    public function index(Request $request): void
    {
        Middleware::authentifier();

        $pdo = Database::connexion();
        $conditions = [];
        $params = [];

        if ($statut = $request->query('statut')) {
            if (!in_array($statut, self::STATUTS_VALIDES, true)) {
                Response::erreur('Statut invalide.', 422);
            }
            $conditions[] = 'co.statut = :statut';
            $params['statut'] = $statut;
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $sql = "SELECT co.id, co.numero_commande, co.statut, co.total, co.adresse_livraison, co.created_at,
                       cl.nom AS client_nom, cl.telephone AS client_telephone
                FROM commandes co
                JOIN clients cl ON cl.id = co.client_id
                {$where}
                ORDER BY co.created_at DESC
                LIMIT 200";

        $requete = $pdo->prepare($sql);
        $requete->execute($params);

        Response::json(['commandes' => $requete->fetchAll(PDO::FETCH_ASSOC)]);
    }

    /** GET /api/commandes/{id} — détail complet + lien WhatsApp (admin uniquement). */
    public function show(Request $request): void
    {
        $utilisateur = Middleware::authentifier();
        $id = (int) $request->param('id');

        $pdo = Database::connexion();

        $requete = $pdo->prepare(
            'SELECT co.*, cl.nom AS client_nom, cl.telephone AS client_telephone, cl.adresse AS client_adresse
             FROM commandes co JOIN clients cl ON cl.id = co.client_id
             WHERE co.id = :id LIMIT 1'
        );
        $requete->execute(['id' => $id]);
        $commande = $requete->fetch(PDO::FETCH_ASSOC);

        if (!$commande) {
            Response::erreur('Commande introuvable.', 404);
        }

        $requeteLignes = $pdo->prepare(
            'SELECT lc.produit_id, lc.quantite, lc.prix_unitaire, p.nom AS nom_produit, p.image_url
             FROM lignes_commande lc JOIN produits p ON p.id = lc.produit_id
             WHERE lc.commande_id = :id'
        );
        $requeteLignes->execute(['id' => $id]);
        $lignes = $requeteLignes->fetchAll(PDO::FETCH_ASSOC);

        $reponse = ['commande' => $commande, 'lignes' => $lignes];

        // Le lien WhatsApp prérempli n'est utile qu'au propriétaire (admin)
        if ($utilisateur['role'] === 'admin') {
            $client = ['nom' => $commande['client_nom'], 'telephone' => $commande['client_telephone']];
            $notifications = (new NotificationManager())->notifierNouvelleCommande($commande, $client, $lignes);
            $reponse['lien_whatsapp'] = $notifications['whatsapp']['lien'] ?? null;
        }

        Response::json($reponse);
    }

    /** PUT /api/commandes/{id}/statut — admin + employé. */
    public function changerStatut(Request $request): void
    {
        $utilisateur = Middleware::authentifier();
        $id = (int) $request->param('id');
        $nouveauStatut = $request->input('statut');

        if (!in_array($nouveauStatut, self::STATUTS_VALIDES, true)) {
            Response::erreur('Statut invalide.', 422, ['statut' => 'Doit être : ' . implode(', ', self::STATUTS_VALIDES)]);
        }

        $pdo = Database::connexion();
        $pdo->beginTransaction();
        try {
            $requeteCommande = $pdo->prepare('SELECT * FROM commandes WHERE id = :id FOR UPDATE');
            $requeteCommande->execute(['id' => $id]);
            $commande = $requeteCommande->fetch(PDO::FETCH_ASSOC);

            if (!$commande) {
                $pdo->rollBack();
                Response::erreur('Commande introuvable.', 404);
            }

            $ancienStatut = $commande['statut'];

            if ($ancienStatut !== $nouveauStatut) {
                $requeteLignes = $pdo->prepare('SELECT produit_id, quantite FROM lignes_commande WHERE commande_id = :id');
                $requeteLignes->execute(['id' => $id]);
                $lignes = $requeteLignes->fetchAll(PDO::FETCH_ASSOC);

                $entreeVersLivree = $nouveauStatut === 'livree' && $ancienStatut !== 'livree';
                $sortieDeLivree = $ancienStatut === 'livree' && $nouveauStatut !== 'livree';

                if ($entreeVersLivree) {
                    // Livraison : on sort le stock correspondant à chaque ligne
                    $this->appliquerMouvement($pdo, $lignes, 'sortie', "Livraison commande {$commande['numero_commande']}", $utilisateur['id']);
                } elseif ($sortieDeLivree) {
                    // Annulation d'une commande déjà livrée (ou retour en préparation) : on recrédite le stock
                    $this->appliquerMouvement($pdo, $lignes, 'entree', "Retour stock commande {$commande['numero_commande']}", $utilisateur['id']);
                }

                $pdo->prepare('UPDATE commandes SET statut = :statut WHERE id = :id')
                    ->execute(['statut' => $nouveauStatut, 'id' => $id]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            error_log('Erreur changement statut commande : ' . $e->getMessage());
            Response::erreur('Erreur lors du changement de statut.', 500);
        }

        Response::json(['message' => 'Statut mis à jour.', 'statut' => $nouveauStatut]);
    }

    /** @param array<int, array{produit_id:int, quantite:int}> $lignes */
    private function appliquerMouvement(PDO $pdo, array $lignes, string $type, string $motif, int $utilisateurId): void
    {
        $signe = $type === 'entree' ? '+' : '-';

        $majStock = $pdo->prepare("UPDATE produits SET quantite_stock = quantite_stock {$signe} :quantite WHERE id = :produit_id");
        $insertion = $pdo->prepare(
            'INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id)
             VALUES (:produit_id, :type, :quantite, :motif, :utilisateur_id)'
        );

        foreach ($lignes as $ligne) {
            $majStock->execute(['quantite' => $ligne['quantite'], 'produit_id' => $ligne['produit_id']]);
            $insertion->execute([
                'produit_id'     => $ligne['produit_id'],
                'type'           => $type,
                'quantite'       => $ligne['quantite'],
                'motif'          => $motif,
                'utilisateur_id' => $utilisateurId,
            ]);
        }
    }

    private function genererNumeroCommande(PDO $pdo): string
    {
        $prefixe = 'CMD-' . date('Ymd') . '-';

        for ($tentative = 0; $tentative < 5; $tentative++) {
            $requete = $pdo->prepare("SELECT COUNT(*) FROM commandes WHERE numero_commande LIKE :motif");
            $requete->execute(['motif' => $prefixe . '%']);
            $sequence = (int) $requete->fetchColumn() + 1 + $tentative;
            $numero = $prefixe . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);

            $verif = $pdo->prepare('SELECT 1 FROM commandes WHERE numero_commande = :numero LIMIT 1');
            $verif->execute(['numero' => $numero]);
            if (!$verif->fetchColumn()) {
                return $numero;
            }
        }

        // Filet de sécurité improbable : suffixe aléatoire
        return $prefixe . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
