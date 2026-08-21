<?php

namespace App\Notifications;

use App\Core\Database;

/**
 * Canal WhatsApp v1 : pas d'API WhatsApp Business (payante, à activer en v2),
 * on génère simplement un lien https://wa.me/... avec un message prérempli
 * que le propriétaire ouvre en un clic depuis le tableau de bord.
 */
class WhatsAppChannel implements NotificationChannel
{
    public function construire(array $commande, array $client, array $lignes): array
    {
        $numeroProprietaire = $this->recupererNumeroProprietaire();

        $message = "🛎️ Nouvelle commande {$commande['numero_commande']}\n";
        $message .= "Client : {$client['nom']} ({$client['telephone']})\n";
        $message .= "Livraison : {$commande['adresse_livraison']}\n\n";

        foreach ($lignes as $ligne) {
            $sousTotal = $ligne['quantite'] * $ligne['prix_unitaire'];
            $message .= "- {$ligne['quantite']} x {$ligne['nom_produit']} = " . number_format($sousTotal, 0, ',', ' ') . " FCFA\n";
        }

        $message .= "\nTotal : " . number_format($commande['total'], 0, ',', ' ') . " FCFA (paiement à la livraison)";

        if (!empty($commande['note'])) {
            $message .= "\nNote client : {$commande['note']}";
        }

        $lien = $numeroProprietaire
            ? 'https://wa.me/' . $numeroProprietaire . '?text=' . rawurlencode($message)
            : null;

        return [
            'type'    => 'whatsapp',
            'contenu' => $message,
            'lien'    => $lien,
        ];
    }

    private function recupererNumeroProprietaire(): ?string
    {
        $pdo = Database::connexion();
        $requete = $pdo->prepare('SELECT valeur FROM parametres WHERE cle = :cle LIMIT 1');
        $requete->execute(['cle' => 'whatsapp_proprietaire']);
        $valeur = $requete->fetchColumn();

        if (!$valeur) {
            return null;
        }

        // wa.me attend un numéro sans "+", sans espaces, avec l'indicatif pays
        return preg_replace('/[^0-9]/', '', $valeur);
    }
}
