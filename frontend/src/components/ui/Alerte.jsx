const STYLES = {
  erreur: 'bg-red-50 text-red-700 border-red-200',
  succes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
}

/** Bandeau d'alerte réutilisé pour les messages d'erreur/succès des formulaires. */
export default function Alerte({ type = 'erreur', children }) {
  if (!children) return null
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${STYLES[type]}`} role="alert">
      {children}
    </div>
  )
}
