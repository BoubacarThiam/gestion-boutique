import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { ErreurApi } from '../../api/client'
import Alerte from '../../components/ui/Alerte'
import logo from '../../assets/logo-tdmgbc.jpg'
import fondConnexion from '../../assets/connexion-fond.jpg'

/** Connexion de l'espace gestion (admin / employé). Pas d'inscription publique. */
export default function Connexion() {
  const { connecter, estConnecte, chargement } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const motionReduit = useReducedMotion()

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-marque-950 px-4">
      {/* Fond plein écran : léger zoom/pan continu (Ken Burns) — isolé dans
          sa propre couche pour que l'agrandissement ne déborde jamais du
          cadre (voir `overflow-hidden` ci-dessus) ni ne fasse bouger la carte. */}
      <div
        className="absolute inset-0 animate-kenburns bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(25,4,3,0.45), rgba(25,4,3,0.80)), url(${fondConnexion})`,
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: motionReduit ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionReduit ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/95 p-6 shadow-elevee backdrop-blur-sm sm:p-8"
      >
        <motion.img
          src={logo}
          alt="TDMGBC"
          initial={{ opacity: 0, scale: 0.7, rotate: motionReduit ? 0 : -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: motionReduit ? 0 : 0.5, delay: motionReduit ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-4 h-20 w-20 rounded-full object-cover shadow-soft ring-4 ring-or-100"
        />
        <h1 className="text-center text-2xl font-display font-bold tracking-tight text-gray-900">Espace gestion</h1>
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
      </motion.div>
    </div>
  )
}
