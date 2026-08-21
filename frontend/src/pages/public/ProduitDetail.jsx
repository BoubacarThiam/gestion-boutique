import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { catalogueApi } from '../../api/public'
import { urlFichier } from '../../api/client'
import { usePanier } from '../../context/PanierContext'
import { formaterFCFA } from '../../utils/format'
import Spinner from '../../components/ui/Spinner'
import Alerte from '../../components/ui/Alerte'

/** Fiche produit détaillée avec ajout au panier. */
export default function ProduitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ajouter } = usePanier()
  const [produit, setProduit] = useState(null)
  const [quantite, setQuantite] = useState(1)
  const [erreur, setErreur] = useState('')
  const [ajoute, setAjoute] = useState(false)

  useEffect(() => {
    setErreur('')
    setProduit(null)
    catalogueApi
      .produit(id)
      .then((d) => setProduit(d.produit))
      .catch(() => setErreur('Ce produit est introuvable ou n\'est plus disponible.'))
  }, [id])

  function ajouterAuPanier() {
    ajouter(produit, quantite)
    setAjoute(true)
    setTimeout(() => setAjoute(false), 1500)
  }

  if (erreur) {
    return (
      <div className="flex flex-col gap-4">
        <Alerte>{erreur}</Alerte>
        <button onClick={() => navigate('/')} className="btn-secondaire self-start">← Retour au catalogue</button>
      </div>
    )
  }

  if (!produit) {
    return <div className="flex justify-center py-12"><Spinner taille={32} /></div>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
        {produit.image_url ? (
          <img src={urlFichier(produit.image_url)} alt={produit.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl text-gray-300">🖼️</div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-marque-600">{produit.categorie_nom}</p>
          <h1 className="text-2xl font-bold text-gray-900">{produit.nom}</h1>
          <p className="mt-2 text-2xl font-bold text-marque-700">{formaterFCFA(produit.prix_vente)}</p>
        </div>

        {produit.description && <p className="whitespace-pre-line text-gray-600">{produit.description}</p>}

        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700">Quantité</span>
          <div className="flex items-center rounded-xl border border-gray-300">
            <button onClick={() => setQuantite((q) => Math.max(1, q - 1))} className="px-4 py-2 text-lg font-bold text-gray-600" aria-label="Diminuer la quantité">−</button>
            <span className="w-10 text-center font-semibold">{quantite}</span>
            <button onClick={() => setQuantite((q) => q + 1)} className="px-4 py-2 text-lg font-bold text-gray-600" aria-label="Augmenter la quantité">+</button>
          </div>
        </div>

        <button onClick={ajouterAuPanier} className="btn-primaire w-full sm:w-auto">
          {ajoute ? '✓ Ajouté au panier' : '🛒 Ajouter au panier'}
        </button>
      </div>
    </div>
  )
}
