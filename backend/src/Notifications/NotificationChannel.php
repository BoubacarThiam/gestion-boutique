<?php

namespace App\Notifications;

/**
 * Contrat commun à tous les canaux de notification (WhatsApp aujourd'hui,
 * SMS / push en v2). Permet d'ajouter un canal sans toucher au reste du code.
 */
interface NotificationChannel
{
    /**
     * Construit la notification pour une nouvelle commande.
     * Ne l'envoie pas forcément elle-même (ex: WhatsApp v1 renvoie juste un
     * lien à ouvrir, faute d'API WhatsApp Business) — voir NotificationManager.
     *
     * @param array $commande   Ligne de la table `commandes` (+ 'numero_commande', 'total'...)
     * @param array $client     Ligne de la table `clients`
     * @param array $lignes     Lignes de la commande (produit, quantite, prix_unitaire)
     * @return array{type:string, contenu:string, lien?:string}
     */
    public function construire(array $commande, array $client, array $lignes): array;
}
