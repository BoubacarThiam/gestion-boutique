import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ErreurApi } from '../../api/client'
import Alerte from '../../components/ui/Alerte'

/** Connexion de l'espace gestion (admin / employé). Pas d'inscription publique. */
export default function Connexion() {
  const { connecter, estConnecte, chargement } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  if (!chargement && estConnecte) {
    return <Navigate to={state?.depuis?.pathname || '/gestion'} replace />
  }

  async function seConnecter(e) {
    e.preventDefault()
    setErreur('')
    setEnvoiEnCours(true)
    try {
      await connecter(telephone, motDePasse)
      navigate(state?.depuis?.pathname || '/gestion', { replace: true })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Connexion impossible, veuillez réessayer.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="carte w-full max-w-sm p-6">
        <h1 className="text-center text-2xl font-bold text-gray-900">Espace gestion</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Réservé au propriétaire et aux employés</p>

        <Alerte>{erreur}</Alerte>

        <form onSubmit={seConnecter} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="telephone">Téléphone</label>
            <input
              id="telephone"
              required
              autoFocus
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="champ"
              placeholder="77 123 45 67"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="mdp">Mot de passe</label>
            <input
              id="mdp"
              required
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="champ"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={envoiEnCours} className="btn-primaire w-full">
            {envoiEnCours ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
