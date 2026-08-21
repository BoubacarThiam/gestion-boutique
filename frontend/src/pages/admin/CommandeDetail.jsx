import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { commandesApi } from '../../api/commandes'
import { ErreurApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import Alerte from '../../components/ui/Alerte'
import Badge from '../../components/ui/Badge'
import ImageProduit from '../../components/ui/ImageProduit'
import { formaterFCFA, formaterDate } from '../../utils/format'
import { infosStatut } from '../../utils/statuts'

/** Détail d'une commande : lignes, client, changement de statut, alerte WhatsApp. */
export default function CommandeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { estAdmin } = useAuth()

  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function charger() {
    setChargement(true)
    commandesApi
      .detail(id)
      .then(setDonnees)
      .catch(() => setErreur('Commande introuvable.'))
      .finally(() => setChargement(false))
  }

  useEffect(charger, [id])

  async function changerStatut(nouveauStatut, messageConfirmation) {
    if (messageConfirmation && !window.confirm(messageConfirmation)) return
    setEnCours(true)
    setErreur('')
    try {
      await commandesApi.changerStatut(id, nouveauStatut)
      charger()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Erreur lors du changement de statut.')
    } finally {
      setEnCours(false)
    }
  }

  if (chargement) return <div className="flex justify-center py-12"><Spinner taille={32} /></div>
  if (!donnees) return <Alerte>{erreur || 'Commande introuvable.'}</Alerte>

  const { commande, lignes, lien_whatsapp } = donnees
  const info = infosStatut(commande.statut)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link to="/gestion/commandes" className="text-sm font-semibold text-gray-500 hover:text-gray-700">← Retour aux commandes</Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{commande.numero_commande}</h1>
          <p className="text-sm text-gray-500">{formaterDate(commande.created_at)}</p>
        </div>
        <Badge classe={info.classe}>{info.libelle}</Badge>
      </div>

      <Alerte>{erreur}</Alerte>

      {/* Actions de changement de statut, contextuelles à l'état actuel */}
      <div className="flex flex-wrap gap-2">
        {commande.statut === 'nouvelle' && (
          <>
            <button disabled={enCours} onClick={() => changerStatut('en_preparation')} className="btn-primaire">🔧 Mettre en préparation</button>
            <button disabled={enCours} onClick={() => changerStatut('annulee', 'Annuler cette commande ?')} className="btn-danger">Annuler</button>
          </>
        )}
        {commande.statut === 'en_preparation' && (
          <>
            <button disabled={enCours} onClick={() => changerStatut('livree', 'Confirmer la livraison ? Le stock sera décrémenté.')} className="btn-primaire">✅ Marquer comme livrée</button>
            <button disabled={enCours} onClick={() => changerStatut('annulee', 'Annuler cette commande ?')} className="btn-danger">Annuler</button>
          </>
        )}
        {commande.statut === 'livree' && (
          <button disabled={enCours} onClick={() => changerStatut('annulee', 'Annuler cette commande livrée ? Le stock sera recrédité.')} className="btn-danger">
            ↩️ Annuler (recrédite le stock)
          </button>
        )}
        {commande.statut === 'annulee' && (
          <button disabled={enCours} onClick={() => changerStatut('nouvelle', 'Réactiver cette commande ?')} className="btn-secondaire">↩️ Réactiver</button>
        )}

        {estAdmin && lien_whatsapp && (
          <a href={lien_whatsapp} target="_blank" rel="noreferrer" className="btn-discret bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            💬 Alerter via WhatsApp
          </a>
        )}
      </div>

      <section className="carte p-4">
        <h2 className="mb-2 font-bold text-gray-800">Client</h2>
        <p className="font-semibold text-gray-800">{commande.client_nom}</p>
        <p className="text-sm text-gray-600">{commande.client_telephone}</p>
        <p className="mt-1 text-sm text-gray-600">📍 {commande.adresse_livraison}</p>
        {commande.note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">📝 {commande.note}</p>}
      </section>

      <section className="carte overflow-hidden">
        <h2 className="p-4 pb-0 font-bold text-gray-800">Articles</h2>
        <ul className="divide-y divide-gray-100 p-4 pt-2">
          {lignes.map((l) => (
            <li key={l.produit_id} className="flex items-center gap-3 py-3">
              <ImageProduit chemin={l.image_url} alt={l.nom_produit} className="h-12 w-12 shrink-0 rounded-lg" tailleRepli="text-xl" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{l.nom_produit}</p>
                <p className="text-sm text-gray-500">{l.quantite} × {formaterFCFA(l.prix_unitaire)}</p>
              </div>
              <p className="font-semibold text-gray-800">{formaterFCFA(l.quantite * l.prix_unitaire)}</p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <span className="font-bold text-gray-700">Total</span>
          <span className="text-xl font-bold text-marque-700">{formaterFCFA(commande.total)}</span>
        </div>
      </section>
    </div>
  )
}
