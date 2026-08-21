import { useEffect, useState } from 'react'
import { catalogueApi } from '../../api/public'
import CarteProduit from '../../components/produits/CarteProduit'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Alerte from '../../components/ui/Alerte'

/** Page d'accueil publique : catalogue filtrable par catégorie + recherche. */
export default function Catalogue() {
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [categorieActive, setCategorieActive] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    catalogueApi.categories().then((d) => setCategories(d.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    setChargement(true)
    setErreur('')
    const params = {}
    if (categorieActive) params.categorie_id = categorieActive
    if (recherche.trim()) params.q = recherche.trim()

    const idTimeout = setTimeout(() => {
      catalogueApi
        .produits(params)
        .then((d) => setProduits(d.produits))
        .catch(() => setErreur('Impossible de charger le catalogue. Vérifiez votre connexion.'))
        .finally(() => setChargement(false))
    }, 250) // léger anti-rebond sur la recherche

    return () => clearTimeout(idTimeout)
  }, [categorieActive, recherche])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notre catalogue</h1>
        <p className="text-sm text-gray-500">Lunettes, montres et accessoires de téléphone — paiement à la livraison.</p>
      </div>

      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher un produit..."
        className="champ"
        aria-label="Rechercher un produit"
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        <button
          onClick={() => setCategorieActive(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
            categorieActive === null ? 'bg-marque-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategorieActive(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              categorieActive === c.id ? 'bg-marque-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {c.nom}
          </button>
        ))}
      </div>

      <Alerte>{erreur}</Alerte>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : produits.length === 0 ? (
        <EtatVide titre="Aucun produit trouvé" description="Essayez une autre catégorie ou un autre mot-clé." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {produits.map((p) => (
            <CarteProduit key={p.id} produit={p} />
          ))}
        </div>
      )}
    </div>
  )
}
