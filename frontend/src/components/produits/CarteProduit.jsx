import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formaterFCFA } from '../../utils/format'
import ImageProduit from '../ui/ImageProduit'
import { useTiltSurvol } from '../../utils/useTiltSurvol'

/** Carte produit affichée dans la grille du catalogue. */
export default function CarteProduit({ produit }) {
  const tilt = useTiltSurvol()

  return (
    <motion.div
      style={tilt.style}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link
        to={`/produit/${produit.id}`}
        className="carte group flex flex-col overflow-hidden transition-shadow duration-200 ease-out hover:shadow-elevee"
      >
        <ImageProduit chemin={produit.image_url} alt={produit.nom} className="aspect-square w-full" tailleRepli="text-4xl" zoom />
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 font-semibold text-gray-800">{produit.nom}</p>
          <p className="mt-auto text-lg font-bold text-marque-700">{formaterFCFA(produit.prix_vente)}</p>
        </div>
      </Link>
    </motion.div>
  )
}
