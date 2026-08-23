import { motion, useReducedMotion } from 'framer-motion'

/**
 * Petite carte chiffre-clé pour le tableau de bord et les rapports.
 * `icone` est optionnel : sans lui, la carte reste sobre (utilisée telle
 * quelle dans Rapports.jsx). Légère apparition + lift au survol, pour
 * donner un peu de relief à l'espace gestion (jusqu'ici plus austère que
 * le catalogue public).
 */
export default function CarteStat({ titre, valeur, sousTitre, accent = 'text-gray-900', icone }) {
  const motionReduit = useReducedMotion()

  return (
    <motion.div
      initial={motionReduit ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionReduit ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="carte p-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-elevee sm:p-5"
    >
      {icone && (
        <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-marque-50 text-lg" aria-hidden="true">
          {icone}
        </span>
      )}
      <p className="text-sm font-medium text-gray-500">{titre}</p>
      <p className={`mt-1 text-2xl font-bold sm:text-3xl ${accent}`}>{valeur}</p>
      {sousTitre && <p className="mt-1 text-xs text-gray-500">{sousTitre}</p>}
    </motion.div>
  )
}
