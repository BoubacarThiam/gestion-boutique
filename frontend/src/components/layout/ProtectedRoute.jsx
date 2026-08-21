import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

/**
 * Protège les routes de l'espace gestion : redirige vers /connexion si non
 * authentifié, et vers le tableau de bord si le rôle ne convient pas
 * (ex: un employé qui tente d'accéder à /utilisateurs).
 */
export default function ProtectedRoute({ rolesAutorises }) {
  const { estConnecte, chargement, utilisateur } = useAuth()
  const location = useLocation()

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner taille={32} />
      </div>
    )
  }

  if (!estConnecte) {
    return <Navigate to="/gestion/connexion" state={{ depuis: location }} replace />
  }

  if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
    return <Navigate to="/gestion" replace />
  }

  return <Outlet />
}
