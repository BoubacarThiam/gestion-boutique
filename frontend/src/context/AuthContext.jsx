import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { definirToken, obtenirToken } from '../api/client'

const AuthContext = createContext(null)

/**
 * Contexte d'authentification pour l'espace de gestion (admin/employé).
 * Au chargement, si un token est stocké, on vérifie sa validité auprès de
 * l'API (/api/auth/me) avant de considérer l'utilisateur comme connecté.
 */
export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const token = obtenirToken()
    if (!token) {
      setChargement(false)
      return
    }
    authApi
      .moi()
      .then((d) => setUtilisateur(d.utilisateur))
      .catch(() => definirToken(null))
      .finally(() => setChargement(false))
  }, [])

  const connecter = useCallback(async (telephone, motDePasse) => {
    const { token, utilisateur } = await authApi.login(telephone, motDePasse)
    definirToken(token)
    setUtilisateur(utilisateur)
    return utilisateur
  }, [])

  const deconnecter = useCallback(() => {
    definirToken(null)
    setUtilisateur(null)
  }, [])

  const estAdmin = utilisateur?.role === 'admin'
  const estConnecte = !!utilisateur

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, estConnecte, estAdmin, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}
