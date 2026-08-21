import { Link } from 'react-router-dom'
import { urlFichier } from '../../api/client'
import { formaterFCFA } from '../../utils/format'

/** Carte produit affichée dans la grille du catalogue. */
export default function CarteProduit({ produit }) {
  return (
    <Link
      to={`/produit/${produit.id}`}
      className="carte group flex flex-col overflow-hidden transition hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-gray-100">
        {produit.image_url ? (
          <img
            src={urlFichier(produit.image_url)}
            alt={produit.nom}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">🖼️</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 font-semibold text-gray-800">{produit.nom}</p>
        <p className="mt-auto text-lg font-bold text-marque-700">{formaterFCFA(produit.prix_vente)}</p>
      </div>
    </Link>
  )
}
