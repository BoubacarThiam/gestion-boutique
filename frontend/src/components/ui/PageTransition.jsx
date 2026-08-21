import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

/**
 * Enveloppe le contenu de chaque route d'un fondu + léger glissement lors
 * de la navigation, plutôt qu'un changement de page instantané et brut.
 * Placé à la place de <Outlet/> dans LayoutPublic et LayoutAdmin : le
 * sidebar/header restent fixes, seul le contenu de la page transitionne.
 */
export default function PageTransition() {
  const { pathname } = useLocation()
  const motionReduit = useReducedMotion()

  const transition = { duration: motionReduit ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: motionReduit ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: motionReduit ? 0 : -6 }}
        transition={transition}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
