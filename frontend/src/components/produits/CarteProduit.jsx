import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formaterFCFA } from '../../utils/format'
import GlowCard from '../ui/GlowCard'
import ImageProduit from '../ui/ImageProduit'
import { useTiltSurvol } from '../../utils/useTiltSurvol'

/**
 * Carte produit affichée dans la grille du catalogue — halo lumineux au
 * survol (GlowCard) + léger tilt 3D, sur tous les produits (toutes
 * catégories confondues, plus seulement les lunettes à l'origine).
 * `group` porté par GlowCard (et non le <Link>, en `display: contents`)
 * pour que le zoom au survol de ImageProduit se déclenche de façon fiable.
 * Le tilt 3D est posé sur un <motion.div> englobant : GlowCard suit déjà
 * le curseur pour son propre halo (document.pointermove), pas de conflit
 * avec ce survol-ci.
 */
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
      <GlowCard glowColor="marque" customSize className="group overflow-hidden bg-white p-0">
        <Link to={`/produit/${produit.id}`} className="contents">
          <ImageProduit chemin={produit.image_url} alt={produit.nom} className="aspect-square w-full" tailleRepli="text-4xl" zoom />
          <div className="flex flex-col gap-1 p-3">
            <p className="line-clamp-2 font-semibold text-gray-800">{produit.nom}</p>
            <p className="mt-auto text-lg font-bold text-marque-700">{formaterFCFA(produit.prix_vente)}</p>
          </div>
        </Link>
      </GlowCard>
    </motion.div>
  )
}
