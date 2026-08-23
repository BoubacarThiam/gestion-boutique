import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { catalogueApi } from '../../api/public'
import { urlFichier } from '../../api/client'
import CarteProduit from '../../components/produits/CarteProduit'
import CarteProduitLunette from '../../components/produits/CarteProduitLunette'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Alerte from '../../components/ui/Alerte'
import ScrollChoreography from '../../components/ui/ScrollChoreography'
import ScrollExpandMedia from '../../components/ui/ScrollExpandMedia'
import connexionFond from '../../assets/connexion-fond.jpg'

// Grille de résultats : les cartes apparaissent en cascade (fondu + léger
// glissement) plutôt que toutes d'un coup — rejoue à chaque changement de
// filtre puisque chaque nouveau produit affiché monte avec un id inédit.
const VARIANTES_GRILLE = { cache: {}, visible: { transition: { staggerChildren: 0.045 } } }
const VARIANTE_CARTE = {
  cache: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// 4 photos vitrine pour l'animation de la section Montres (voir plus bas).
const IMAGES_HERO_MONTRES = {
  topLeft: urlFichier('/uploads/produits/produit_salcir_05_1787317483e.jpeg'),
  topRight: urlFichier('/uploads/produits/produit_salcir_11_1787317483k.jpeg'),
  bottomLeft: urlFichier('/uploads/produits/produit_salcir_07_1787317483g.jpeg'),
  bottomRight: urlFichier('/uploads/produits/produit_salcir_08_1787317483h.jpeg'),
}

/** Page d'accueil publique : catalogue filtrable par catégorie + recherche. */
export default function Catalogue() {
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [categorieActive, setCategorieActive] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const motionReduit = useReducedMotion()

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

  // Anime uniquement quand la catégorie "Montres" est sélectionnée.
  const categorieMontres = categories.find((c) => c.nom === 'Montres')
  const afficherAnimationMontres = categorieMontres && categorieActive === categorieMontres.id

  // La section (sticky, 300vh) doit être "accrochée" en haut de l'écran
  // pour que les 4 images soient bien centrées à l'apparition — sinon,
  // juste après le clic sur "Montres", elle démarre en dessous du pli et
  // le centre visuel tombe hors de l'écran tant qu'on n'a pas scrollé.
  const refAnimationMontres = useRef(null)
  useEffect(() => {
    if (afficherAnimationMontres) {
      refAnimationMontres.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afficherAnimationMontres])

  // Halo lumineux (GlowCard) uniquement quand la catégorie "Lunettes" est sélectionnée.
  const categorieLunettes = categories.find((c) => c.nom === 'Lunettes')
  const afficherGlowLunettes = categorieLunettes && categorieActive === categorieLunettes.id

  return (
    <div className="flex flex-col gap-5">
      {/* Hero plein écran : grossit au scroll pour révéler le catalogue.
          Casse la largeur max/padding du <main> parent (même technique que
          l'animation Montres plus bas), nécessaire au 100dvh/100vw utilisés. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <ScrollExpandMedia
          mediaSrc={urlFichier('/uploads/produits/produit_lunette23.jpeg')}
          bgImageSrc={connexionFond}
          title="Bienvenue chez TDMGBC"
          date="Collection 2026"
          scrollToExpand="Faites défiler pour découvrir"
        />
      </div>

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

      {afficherAnimationMontres && (
        // Casse la largeur max/padding du <main> parent pour occuper tout l'écran,
        // nécessaire aux unités vw utilisées par l'animation.
        <div ref={refAnimationMontres} className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
          <ScrollChoreography images={IMAGES_HERO_MONTRES} />
        </div>
      )}

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : produits.length === 0 ? (
        <EtatVide titre="Aucun produit trouvé" description="Essayez une autre catégorie ou un autre mot-clé." />
      ) : (
        <motion.div
          variants={motionReduit ? undefined : VARIANTES_GRILLE}
          initial={motionReduit ? false : 'cache'}
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          {produits.map((p) => (
            <motion.div key={p.id} variants={motionReduit ? undefined : VARIANTE_CARTE}>
              {afficherGlowLunettes ? <CarteProduitLunette produit={p} /> : <CarteProduit produit={p} />}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
