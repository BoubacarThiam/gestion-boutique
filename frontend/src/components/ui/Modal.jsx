import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** Boîte de dialogue modale générique (formulaires, confirmations). */
export default function Modal({ ouvert, onFermer, titre, children, largeur = 'max-w-lg' }) {
  const motionReduit = useReducedMotion()

  useEffect(() => {
    if (!ouvert) return
    function surEchap(e) {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', surEchap)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', surEchap)
      document.body.style.overflow = ''
    }
  }, [ouvert, onFermer])

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial="cache"
          animate="visible"
          exit="cache"
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            variants={{ cache: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: motionReduit ? 0 : 0.2 }}
            onClick={onFermer}
            aria-hidden="true"
          />
          <motion.div
            className={`relative z-10 w-full ${largeur} max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-elevee sm:rounded-2xl sm:p-6`}
            variants={{ cache: { opacity: 0, y: motionReduit ? 0 : 24, scale: motionReduit ? 1 : 0.97 }, visible: { opacity: 1, y: 0, scale: 1 } }}
            transition={{ duration: motionReduit ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={titre}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-gray-900">{titre}</h2>
              <button
                onClick={onFermer}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
