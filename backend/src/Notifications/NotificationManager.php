<?php

namespace App\Notifications;

/**
 * Point d'entrée unique pour notifier le propriétaire d'un évènement.
 * Reste volontairement simple : la notification "in-app" est calculée à la
 * volée par DashboardController (compte des commandes au statut 'nouvelle'),
 * pas besoin de table dédiée pour la v1.
 *
 * Ajouter un canal en v2 (SMS, push) = créer une classe qui implémente
 * NotificationChannel et l'ajouter au tableau $canaux ci-dessous.
 */
class NotificationManager
{
    /** @var NotificationChannel[] */
    private array $canaux;

    public function __construct()
    {
        $this->canaux = [
            new WhatsAppChannel(),
            // v2 : new SmsChannel(), new PushChannel(),
        ];
    }

    /**
     * Construit les notifications d'une nouvelle commande pour tous les
     * canaux actifs. Retourne un tableau indexé par type de canal, ex :
     *   ['whatsapp' => ['type' => 'whatsapp', 'lien' => 'https://wa.me/...']]
     */
    public function notifierNouvelleCommande(array $commande, array $client, array $lignes): array
    {
        $resultats = [];
        foreach ($this->canaux as $canal) {
            $notification = $canal->construire($commande, $client, $lignes);
            $resultats[$notification['type']] = $notification;
        }
        return $resultats;
    }
}
