import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePanier } from '../../context/PanierContext'
import { catalogueApi } from '../../api/public'
import { ErreurApi } from '../../api/client'
import { formaterFCFA } from '../../utils/format'
import Alerte from '../../components/ui/Alerte'

/** Formulaire de validation de commande : identité + adresse, sans compte client. */
export default function ValiderCommande() {
  const { articles, total, vider } = usePanier()
  const navigate = useNavigate()

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [note, setNote] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  if (articles.length === 0) {
    return <Navigate to="/panier" replace />
  }

  async function valider(e) {
    e.preventDefault()
    setErreur('')
    setEnvoiEnCours(true)
    try {
      const reponse = await catalogueApi.creerCommande({
        nom,
        telephone,
        adresse_livraison: adresse,
        note,
        lignes: articles.map((a) => ({ produit_id: a.produit_id, quantite: a.quantite })),
      })
      vider()
      navigate('/confirmation', {
        state: { numeroCommande: reponse.numero_commande, total: reponse.total },
        replace: true,
      })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Une erreur est survenue, veuillez réessayer.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900">Valider ma commande</h1>

      <div className="carte flex items-center justify-between p-4">
        <span className="font-semibold text-gray-700">Total à payer à la livraison</span>
        <span className="text-xl font-bold text-marque-700">{formaterFCFA(total)}</span>
      </div>

      <Alerte>{erreur}</Alerte>

      <form onSubmit={valider} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="nom">Nom complet</label>
          <input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} className="champ" placeholder="Votre nom" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="telephone">Numéro de téléphone</label>
          <input
            id="telephone"
            required
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="champ"
            placeholder="77 123 45 67"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="adresse">Adresse de livraison</label>
          <textarea
            id="adresse"
            required
            rows={2}
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="champ resize-none"
            placeholder="Quartier, rue, repère..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="note">Note (facultatif)</label>
          <textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="champ resize-none"
            placeholder="Ex: appeler avant de venir"
          />
        </div>

        <button type="submit" disabled={envoiEnCours} className="btn-primaire w-full text-lg">
          {envoiEnCours ? 'Envoi en cours...' : 'Confirmer la commande'}
        </button>
      </form>
    </div>
  )
}
