import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { catalogueApi } from '../../api/public'
import { usePanier } from '../../context/PanierContext'

/** Mise en page du site public (catalogue, panier, commande). */
export default function LayoutPublic() {
  const { nombreArticles } = usePanier()
  const [nomBoutique, setNomBoutique] = useState('Ma Boutique')

  useEffect(() => {
    catalogueApi
      .parametres()
      .then((d) => d.parametres?.nom_boutique && setNomBoutique(d.parametres.nom_boutique))
      .catch(() => {}) // hors-ligne / API indisponible : on garde le nom par défaut
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="truncate text-lg font-bold text-marque-700">
            {nomBoutique}
          </Link>
          <Link
            to="/panier"
            className="relative flex items-center gap-2 rounded-xl bg-marque-50 px-3 py-2 font-semibold text-marque-700 hover:bg-marque-100"
            aria-label="Voir le panier"
          >
            🛒 <span className="hidden sm:inline">Panier</span>
            {nombreArticles > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-marque-600 text-xs font-bold text-white">
                {nombreArticles}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
        <p>Paiement à la livraison (cash). Livraison organisée après confirmation de votre commande.</p>
        <Link to="/gestion" className="mt-2 inline-block text-xs text-gray-400 hover:text-gray-600">
          Espace gestion
        </Link>
      </footer>
    </div>
  )
}
