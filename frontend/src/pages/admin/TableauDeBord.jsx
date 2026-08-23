import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { dashboardApi } from '../../api/dashboard'
import { useAuth } from '../../context/AuthContext'
import CarteStat from '../../components/ui/CarteStat'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import { formaterFCFA, formaterDate } from '../../utils/format'

export default function TableauDeBord() {
  const { utilisateur } = useAuth()
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)
  const motionReduit = useReducedMotion()

  useEffect(() => {
    dashboardApi.resume().then(setDonnees).finally(() => setChargement(false))
  }, [])

  if (chargement) {
    return <div className="flex justify-center py-12"><Spinner taille={32} /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {utilisateur?.nom.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500">Voici un aperçu de l'activité de la boutique.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CarteStat
          icone="🔔"
          titre="Nouvelles commandes"
          valeur={donnees.nouvelles_commandes.nombre}
          accent={donnees.nouvelles_commandes.nombre > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <CarteStat icone="⏳" titre="En cours" valeur={donnees.commandes_en_cours} />
        <CarteStat icone="🛍️" titre="Ventes du jour" valeur={donnees.ventes_du_jour.nombre_commandes} />
        <CarteStat icone="💰" titre="Chiffre d'affaires du jour" valeur={formaterFCFA(donnees.ventes_du_jour.chiffre_affaires)} accent="text-marque-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification in-app : nouvelles commandes à traiter */}
        <motion.section
          initial={motionReduit ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionReduit ? 0 : 0.35, delay: motionReduit ? 0 : 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="carte p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">🔔 Nouvelles commandes</h2>
            <Link to="/gestion/commandes?statut=nouvelle" className="text-sm font-semibold text-marque-600">Voir tout</Link>
          </div>
          {donnees.nouvelles_commandes.liste.length === 0 ? (
            <EtatVide titre="Aucune nouvelle commande" description="Vous êtes à jour !" />
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {donnees.nouvelles_commandes.liste.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/gestion/commandes/${c.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition duration-150 ease-out hover:bg-marque-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">{c.numero_commande}</p>
                        <p className="truncate text-sm text-gray-500">{c.client_nom} · {formaterDate(c.created_at)}</p>
                      </div>
                    </div>
                    <p className="shrink-0 font-bold text-marque-700">{formaterFCFA(c.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* Alerte stock bas */}
        <motion.section
          initial={motionReduit ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionReduit ? 0 : 0.35, delay: motionReduit ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="carte p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">⚠️ Stock bas</h2>
            <Link to="/gestion/stock" className="text-sm font-semibold text-marque-600">Gérer le stock</Link>
          </div>
          {donnees.stock_bas.liste.length === 0 ? (
            <EtatVide titre="Aucune alerte" description="Tous les produits sont bien approvisionnés." />
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {donnees.stock_bas.liste.slice(0, 6).map((p) => (
                <li key={p.id} className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition duration-150 ease-out hover:bg-amber-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                    <p className="truncate font-semibold text-gray-800">{p.nom}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-amber-600">{p.quantite_stock} restant(s)</p>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  )
}
