/** Placeholder affiché quand une liste est vide (aucune commande, aucun produit...). */
export default function EtatVide({ titre, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-gray-700">{titre}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
