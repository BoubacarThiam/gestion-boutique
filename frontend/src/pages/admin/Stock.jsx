import { useEffect, useState } from 'react'
import { stockApi } from '../../api/stock'
import { produitsApi } from '../../api/produits'
import { ErreurApi } from '../../api/client'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Alerte from '../../components/ui/Alerte'
import Badge from '../../components/ui/Badge'
import { formaterDate } from '../../utils/format'

const VIDE = { produit_id: '', type: 'entree', quantite: 1, motif: '' }

export default function Stock() {
  const [produits, setProduits] = useState([])
  const [alertes, setAlertes] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaire, setFormulaire] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  function charger() {
    setChargement(true)
    Promise.all([
      produitsApi.liste({ actif: 1 }),
      stockApi.alertes(),
      stockApi.mouvements(),
    ])
      .then(([p, a, m]) => {
        setProduits(p.produits)
        setAlertes(a.produits)
        setMouvements(m.mouvements)
      })
      .finally(() => setChargement(false))
  }

  useEffect(charger, [])

  async function enregistrer(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur('')
    setSucces('')
    try {
      await stockApi.enregistrerMouvement(formulaire)
      setSucces('Mouvement enregistré avec succès.')
      setFormulaire(VIDE)
      charger()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  if (chargement) return <div className="flex justify-center py-12"><Spinner taille={32} /></div>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Stock</h1>

      {alertes.length > 0 && (
        <section className="carte border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 font-bold text-amber-800">⚠️ {alertes.length} produit(s) en stock bas</h2>
          <ul className="flex flex-wrap gap-2">
            {alertes.map((p) => (
              <li key={p.id}>
                <Badge classe="bg-amber-100 text-amber-800">{p.nom} — {p.quantite_stock} restant(s)</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="carte p-4">
        <h2 className="mb-3 font-bold text-gray-800">Nouveau mouvement</h2>
        <Alerte type="erreur">{erreur}</Alerte>
        <Alerte type="succes">{succes}</Alerte>
        <form onSubmit={enregistrer} className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">Produit</label>
            <select required value={formulaire.produit_id} onChange={(e) => setFormulaire({ ...formulaire, produit_id: e.target.value })} className="champ">
              <option value="" disabled>Choisir un produit</option>
              {produits.map((p) => <option key={p.id} value={p.id}>{p.nom} (stock actuel : {p.quantite_stock})</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormulaire({ ...formulaire, type: 'entree' })}
                className={`btn flex-1 ${formulaire.type === 'entree' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                ⬇️ Entrée
              </button>
              <button type="button" onClick={() => setFormulaire({ ...formulaire, type: 'sortie' })}
                className={`btn flex-1 ${formulaire.type === 'sortie' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                ⬆️ Sortie
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Quantité</label>
            <input required type="number" min="1" value={formulaire.quantite} onChange={(e) => setFormulaire({ ...formulaire, quantite: e.target.value })} className="champ" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">Motif (facultatif)</label>
            <input value={formulaire.motif} onChange={(e) => setFormulaire({ ...formulaire, motif: e.target.value })} className="champ" placeholder="Ex: Réapprovisionnement fournisseur, casse..." />
          </div>

          <button type="submit" disabled={envoiEnCours} className="btn-primaire sm:col-span-2">
            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer le mouvement'}
          </button>
        </form>
      </section>

      <section className="carte overflow-hidden">
        <h2 className="p-4 pb-2 font-bold text-gray-800">Historique récent</h2>
        {mouvements.length === 0 ? (
          <div className="p-4"><EtatVide titre="Aucun mouvement enregistré" /></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {mouvements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{m.produit_nom}</p>
                  <p className="truncate text-sm text-gray-500">{m.motif || '—'} · {m.utilisateur_nom || 'Système'}</p>
                  <p className="text-xs text-gray-500">{formaterDate(m.created_at)}</p>
                </div>
                <Badge classe={m.type === 'entree' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                  {m.type === 'entree' ? '+' : '−'}{m.quantite}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
