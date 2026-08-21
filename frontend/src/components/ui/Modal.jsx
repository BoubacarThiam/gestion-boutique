import { useEffect } from 'react'

/** Boîte de dialogue modale générique (formulaires, confirmations). */
export default function Modal({ ouvert, onFermer, titre, children, largeur = 'max-w-lg' }) {
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

  if (!ouvert) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onFermer} aria-hidden="true" />
      <div
        className={`relative z-10 w-full ${largeur} max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6`}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{titre}</h2>
          <button
            onClick={onFermer}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
