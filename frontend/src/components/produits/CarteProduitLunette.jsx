import { Link } from 'react-router-dom'
import { formaterFCFA } from '../../utils/format'
import GlowCard from '../ui/GlowCard'
import ImageProduit from '../ui/ImageProduit'

/**
 * Variante de CarteProduit avec halo lumineux au survol (GlowCard) —
 * réservée à la catégorie Lunettes (voir Catalogue.jsx). `group` porté par
 * GlowCard (et non le <Link>, en `display: contents`) pour que le zoom au
 * survol de ImageProduit se déclenche de façon fiable.
 */
export default function CarteProduitLunette({ produit }) {
  return (
    <GlowCard glowColor="marque" customSize className="group overflow-hidden bg-white p-0">
      <Link to={`/produit/${produit.id}`} className="contents">
        <ImageProduit chemin={produit.image_url} alt={produit.nom} className="aspect-square w-full" tailleRepli="text-4xl" zoom />
        <div className="flex flex-col gap-1 p-3">
          <p className="line-clamp-2 font-semibold text-gray-800">{produit.nom}</p>
          <p className="mt-auto text-lg font-bold text-marque-700">{formaterFCFA(produit.prix_vente)}</p>
        </div>
      </Link>
    </GlowCard>
  )
}
