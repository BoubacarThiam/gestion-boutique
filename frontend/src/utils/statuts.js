// Métadonnées d'affichage des statuts de commande, centralisées ici pour
// rester cohérentes sur tout le tableau de bord (liste, détail, livraisons).
export const STATUTS_COMMANDE = {
  nouvelle: { libelle: 'Nouvelle', classe: 'bg-blue-100 text-blue-700' },
  en_preparation: { libelle: 'En préparation', classe: 'bg-amber-100 text-amber-700' },
  livree: { libelle: 'Livrée', classe: 'bg-emerald-100 text-emerald-700' },
  annulee: { libelle: 'Annulée', classe: 'bg-red-100 text-red-700' },
}

export function infosStatut(statut) {
  return STATUTS_COMMANDE[statut] ?? { libelle: statut, classe: 'bg-gray-100 text-gray-700' }
}
