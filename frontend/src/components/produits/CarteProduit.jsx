import { Link } from 'react-router-dom'
import { formaterFCFA } from '../../utils/format'
import ImageProduit from '../ui/ImageProduit'

/** Carte produit affichée dans la grille du catalogue. */
export default function CarteProduit({ produit }) {
  return (
    <Link
      to={`/produit/${produit.id}`}
      className="carte group flex flex-col overflow-hidden transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevee"
    >
      <ImageProduit chemin={produit.image_url} alt={produit.nom} className="aspect-square w-full" tailleRepli="text-4xl" zoom />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 font-semibold text-gray-800">{produit.nom}</p>
        <p className="mt-auto text-lg font-bold text-marque-700">{formaterFCFA(produit.prix_vente)}</p>
      </div>
    </Link>
  )
}
