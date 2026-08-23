import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

/**
 * Léger tilt 3D au survol (la carte s'incline vers le curseur) — utilisé
 * sur toutes les cartes produit du catalogue pour leur donner du relief.
 * Retourne les props à étaler sur un <motion.div> englobant la carte :
 * `{ style, onMouseMove, onMouseLeave }`. Respecte prefers-reduced-motion
 * (aucune capture d'événement, style neutre).
 */
export function useTiltSurvol({ intensite = 8 } = {}) {
  const motionReduit = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ressort = { stiffness: 300, damping: 22, mass: 0.5 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensite, -intensite]), ressort)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensite, intensite]), ressort)

  if (motionReduit) {
    return { style: {}, onMouseMove: undefined, onMouseLeave: undefined }
  }

  function onMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function onMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return { style: { rotateX, rotateY, transformPerspective: 800 }, onMouseMove, onMouseLeave }
}
