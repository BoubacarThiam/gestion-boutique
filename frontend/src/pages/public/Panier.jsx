import { Link, useNavigate } from 'react-router-dom'
import { usePanier } from '../../context/PanierContext'
import { formaterFCFA } from '../../utils/format'
import EtatVide from '../../components/ui/EtatVide'
import ImageProduit from '../../components/ui/ImageProduit'

/** Panier : liste des articles, modification des quantités, passage à la commande. */
export default function Panier() {
  const { articles, modifierQuantite, retirer, total } = usePanier()
  const navigate = useNavigate()

  if (articles.length === 0) {
    return (
      <EtatVide
        titre="Votre panier est vide"
        description="Parcourez le catalogue pour ajouter des articles."
        action={<Link to="/" className="btn-primaire">Voir le catalogue</Link>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900">Mon panier</h1>

      <div className="flex flex-col gap-3">
        {articles.map((a) => (
          <div key={a.produit_id} className="carte flex items-center gap-3 p-3">
            <ImageProduit chemin={a.image_url} alt={a.nom} className="h-16 w-16 shrink-0 rounded-xl" tailleRepli="text-2xl" />

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-800">{a.nom}</p>
              <p className="text-sm text-gray-500">{formaterFCFA(a.prix_vente)}</p>
            </div>

            <div className="flex items-center rounded-xl border border-gray-300">
              <button
                onClick={() => modifierQuantite(a.produit_id, a.quantite - 1)}
                className="px-3 py-1.5 text-lg font-bold text-gray-600"
                aria-label="Diminuer la quantité"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{a.quantite}</span>
              <button
                onClick={() => modifierQuantite(a.produit_id, a.quantite + 1)}
                className="px-3 py-1.5 text-lg font-bold text-gray-600"
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>

            <button
              onClick={() => retirer(a.produit_id)}
              className="rounded-xl p-2 text-red-500 hover:bg-red-50"
              aria-label={`Retirer ${a.nom} du panier`}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="carte flex items-center justify-between p-4">
        <span className="text-lg font-semibold text-gray-700">Total</span>
        <span className="text-2xl font-bold text-marque-700">{formaterFCFA(total)}</span>
      </div>

      <button onClick={() => navigate('/commande')} className="btn-primaire w-full text-lg">
        Valider la commande →
      </button>
    </div>
  )
}
