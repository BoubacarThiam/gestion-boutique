import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dashboardApi } from '../../api/dashboard'
import logo from '../../assets/logo-tdmgbc.jpg'

const LIENS = [
  { to: '/gestion', label: 'Tableau de bord', icone: '📊', fin: true },
  { to: '/gestion/commandes', label: 'Commandes', icone: '🛍️' },
  { to: '/gestion/livraisons', label: 'Livraisons', icone: '🚚' },
  { to: '/gestion/produits', label: 'Produits', icone: '📦' },
  { to: '/gestion/categories', label: 'Catégories', icone: '🏷️' },
  { to: '/gestion/stock', label: 'Stock', icone: '📥' },
  { to: '/gestion/clients', label: 'Clients', icone: '👥' },
  { to: '/gestion/utilisateurs', label: 'Utilisateurs', icone: '🧑‍💼', roles: ['admin'] },
  { to: '/gestion/rapports', label: 'Rapports', icone: '📈', roles: ['admin'] },
]

/** Mise en page de l'espace gestion : barre latérale (desktop) / menu coulissant (mobile). */
export default function LayoutAdmin() {
  const { utilisateur, deconnecter } = useAuth()
  const navigate = useNavigate()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [nouvellesCommandes, setNouvellesCommandes] = useState(0)

  useEffect(() => {
    let annule = false
    function chargerBadge() {
      dashboardApi
        .resume()
        .then((d) => !annule && setNouvellesCommandes(d.nouvelles_commandes?.nombre ?? 0))
        .catch(() => {})
    }
    chargerBadge()
    // Notification "in-app" : on revérifie régulièrement s'il y a de nouvelles commandes
    const intervalle = setInterval(chargerBadge, 45_000)
    return () => {
      annule = true
      clearInterval(intervalle)
    }
  }, [])

  const liensVisibles = LIENS.filter((l) => !l.roles || l.roles.includes(utilisateur?.role))

  function seDeconnecter() {
    deconnecter()
    navigate('/gestion/connexion')
  }

  const contenuNav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {liensVisibles.map((lien) => (
        <NavLink
          key={lien.to}
          to={lien.to}
          end={lien.fin}
          onClick={() => setMenuOuvert(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition duration-150 ease-out ${
              isActive ? 'bg-marque-600 text-white shadow-soft' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <span className="text-lg" aria-hidden="true">{lien.icone}</span>
          <span className="flex-1">{lien.label}</span>
          {lien.to === '/gestion/commandes' && nouvellesCommandes > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {nouvellesCommandes}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barre latérale desktop */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white sm:flex">
        <div className="flex items-center gap-3 border-b border-marque-100 px-5 py-4">
          <img src={logo} alt="TDMGBC" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-marque-100" />
          <div className="min-w-0">
            <p className="font-display font-bold tracking-tight text-marque-700">Espace gestion</p>
            <p className="truncate text-sm text-gray-500">{utilisateur?.nom}</p>
          </div>
        </div>
        {contenuNav}
        <div className="border-t border-gray-100 p-3">
          <button onClick={seDeconnecter} className="btn-discret w-full justify-start">
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Menu coulissant mobile */}
      {menuOuvert && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOuvert(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-elevee">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <img src={logo} alt="TDMGBC" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-marque-100" />
                <div className="min-w-0">
                  <p className="font-display font-bold tracking-tight text-marque-700">Espace gestion</p>
                  <p className="truncate text-sm text-gray-500">{utilisateur?.nom}</p>
                </div>
              </div>
              <button onClick={() => setMenuOuvert(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Fermer le menu">✕</button>
            </div>
            {contenuNav}
            <div className="border-t border-gray-100 p-3">
              <button onClick={seDeconnecter} className="btn-discret w-full justify-start">
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:hidden">
          <button
            onClick={() => setMenuOuvert(true)}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <p className="font-display font-bold tracking-tight text-marque-700">Espace gestion</p>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
