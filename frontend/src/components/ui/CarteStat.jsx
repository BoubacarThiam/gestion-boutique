/** Petite carte chiffre-clé pour le tableau de bord et les rapports. */
export default function CarteStat({ titre, valeur, sousTitre, accent = 'text-gray-900' }) {
  return (
    <div className="carte p-4 sm:p-5">
      <p className="text-sm font-medium text-gray-500">{titre}</p>
      <p className={`mt-1 text-2xl font-bold sm:text-3xl ${accent}`}>{valeur}</p>
      {sousTitre && <p className="mt-1 text-xs text-gray-500">{sousTitre}</p>}
    </div>
  )
}
