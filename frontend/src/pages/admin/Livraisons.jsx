import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { commandesApi } from '../../api/commandes'
import { ErreurApi } from '../../api/client'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Alerte from '../../components/ui/Alerte'
import Badge from '../../components/ui/Badge'
import { formaterFCFA } from '../../utils/format'
import { infosStatut } from '../../utils/statuts'

/** Vue "à livrer" : commandes nouvelles ou en préparation, avec action rapide de livraison. */
export default function Livraisons() {
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [idEnCours, setIdEnCours] = useState(null)

  function charger() {
    setChargement(true)
    Promise.all([commandesApi.liste({ statut: 'nouvelle' }), commandesApi.liste({ statut: 'en_preparation' })])
      .then(([nouvelles, enPreparation]) => {
        const toutes = [...nouvelles.commandes, ...enPreparation.commandes]
        toutes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // les plus anciennes d'abord
        setCommandes(toutes)
      })
      .finally(() => setChargement(false))
  }

  useEffect(charger, [])

  async function marquerLivree(id) {
    if (!window.confirm('Confirmer la livraison de cette commande ? Le stock sera décrémenté automatiquement.')) return
    setIdEnCours(id)
    setErreur('')
    try {
      await commandesApi.changerStatut(id, 'livree')
      charger()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Erreur lors de la mise à jour.')
    } finally {
      setIdEnCours(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Livraisons</h1>
        <p className="text-sm text-gray-500">Commandes en attente de livraison, de la plus ancienne à la plus récente.</p>
      </div>

      <Alerte>{erreur}</Alerte>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : commandes.length === 0 ? (
        <EtatVide titre="Aucune livraison en attente" description="Toutes les commandes en cours ont été traitées." />
      ) : (
        <div className="flex flex-col gap-3">
          {commandes.map((c) => (
            <div key={c.id} className="carte flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/gestion/commandes/${c.id}`} className="font-semibold text-gray-800 hover:underline">{c.numero_commande}</Link>
                  <Badge classe={infosStatut(c.statut).classe}>{infosStatut(c.statut).libelle}</Badge>
                </div>
                <p className="text-sm text-gray-600">{c.client_nom} · {c.client_telephone}</p>
                <p className="text-sm text-gray-500">📍 {c.adresse_livraison}</p>
                <p className="text-sm font-bold text-gray-800">{formaterFCFA(c.total)}</p>
              </div>
              <button
                disabled={idEnCours === c.id}
                onClick={() => marquerLivree(c.id)}
                className="btn-primaire shrink-0"
              >
                ✅ Marquer comme livrée
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
