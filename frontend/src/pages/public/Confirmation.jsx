import { Link, Navigate, useLocation } from 'react-router-dom'
import { formaterFCFA } from '../../utils/format'

/** Page affichée après validation d'une commande, avec son numéro de suivi. */
export default function Confirmation() {
  const { state } = useLocation()

  if (!state?.numeroCommande) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <div className="text-6xl">✅</div>
      <h1 className="text-2xl font-bold text-gray-900">Commande enregistrée !</h1>
      <p className="text-gray-600">
        Merci, votre commande a bien été reçue. Nous vous contacterons bientôt pour organiser la livraison.
      </p>

      <div className="carte w-full p-5">
        <p className="text-sm text-gray-500">Numéro de commande</p>
        <p className="text-xl font-bold text-marque-700">{state.numeroCommande}</p>
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-500">Total à payer à la livraison</p>
          <p className="text-lg font-bold text-gray-800">{formaterFCFA(state.total)}</p>
        </div>
      </div>

      <Link to="/" className="btn-primaire mt-2">Retour au catalogue</Link>
    </div>
  )
}
