import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
          titre="Nouvelles commandes"
          valeur={donnees.nouvelles_commandes.nombre}
          accent={donnees.nouvelles_commandes.nombre > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <CarteStat titre="En cours" valeur={donnees.commandes_en_cours} />
        <CarteStat titre="Ventes du jour" valeur={donnees.ventes_du_jour.nombre_commandes} />
        <CarteStat titre="Chiffre d'affaires du jour" valeur={formaterFCFA(donnees.ventes_du_jour.chiffre_affaires)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification in-app : nouvelles commandes à traiter */}
        <section className="carte p-4">
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
                  <Link to={`/gestion/commandes/${c.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800">{c.numero_commande}</p>
                      <p className="text-sm text-gray-500">{c.client_nom} · {formaterDate(c.created_at)}</p>
                    </div>
                    <p className="font-bold text-marque-700">{formaterFCFA(c.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Alerte stock bas */}
        <section className="carte p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">⚠️ Stock bas</h2>
            <Link to="/gestion/stock" className="text-sm font-semibold text-marque-600">Gérer le stock</Link>
          </div>
          {donnees.stock_bas.liste.length === 0 ? (
            <EtatVide titre="Aucune alerte" description="Tous les produits sont bien approvisionnés." />
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {donnees.stock_bas.liste.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <p className="font-semibold text-gray-800">{p.nom}</p>
                  <p className="text-sm font-bold text-amber-600">{p.quantite_stock} restant(s)</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
