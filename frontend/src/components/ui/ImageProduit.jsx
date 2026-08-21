import { useState } from 'react'
import { urlFichier } from '../../api/client'

/**
 * Image produit avec révélation en fondu au chargement (léger flou + zoom
 * arrière) et squelette animé pendant l'attente, repli en emoji si absente.
 * Centralise le bloc "fond gris + <img> + repli" dupliqué dans toutes les
 * pages qui affichent des photos produit (catalogue, panier, admin...).
 *
 * `zoom` ajoute un zoom doux au survol du parent : nécessite que l'ancêtre
 * direct porte la classe Tailwind `group` (ex : la carte produit cliquable).
 */
export default function ImageProduit({ chemin, alt, className = 'h-full w-full', tailleRepli = 'text-2xl', zoom = false }) {
  const [charge, setCharge] = useState(false)
  const url = chemin ? urlFichier(chemin) : null

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${tailleRepli} ${className}`}>
        🖼️
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {!charge && <div aria-hidden="true" className="reflet-chargement" />}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setCharge(true)}
        className={`h-full w-full object-cover transition-all duration-[420ms] ease-out ${
          charge ? 'scale-100 opacity-100 blur-none' : 'scale-110 opacity-0 blur-sm'
        } ${zoom ? 'group-hover:scale-110' : ''}`}
      />
    </div>
  )
}
