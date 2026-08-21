import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const PanierContext = createContext(null)
const CLE_STOCKAGE = 'gestion_boutique_panier'

/**
 * Panier client, persisté dans localStorage (survit à un rechargement de
 * page ou une coupure réseau — important vu la connexion parfois faible).
 * Chaque article : { produit_id, nom, prix_vente, image_url, quantite }
 */
export function PanierProvider({ children }) {
  const [articles, setArticles] = useState(() => {
    try {
      const brut = localStorage.getItem(CLE_STOCKAGE)
      return brut ? JSON.parse(brut) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(articles))
    } catch {
      // stockage indisponible (navigation privée...) : on continue sans persister
    }
  }, [articles])

  function ajouter(produit, quantite = 1) {
    setArticles((prev) => {
      const existant = prev.find((a) => a.produit_id === produit.id)
      if (existant) {
        return prev.map((a) =>
          a.produit_id === produit.id ? { ...a, quantite: a.quantite + quantite } : a
        )
      }
      return [
        ...prev,
        {
          produit_id: produit.id,
          nom: produit.nom,
          prix_vente: produit.prix_vente,
          image_url: produit.image_url,
          quantite,
        },
      ]
    })
  }

  function modifierQuantite(produitId, quantite) {
    if (quantite <= 0) {
      retirer(produitId)
      return
    }
    setArticles((prev) => prev.map((a) => (a.produit_id === produitId ? { ...a, quantite } : a)))
  }

  function retirer(produitId) {
    setArticles((prev) => prev.filter((a) => a.produit_id !== produitId))
  }

  function vider() {
    setArticles([])
  }

  const total = useMemo(() => articles.reduce((s, a) => s + a.prix_vente * a.quantite, 0), [articles])
  const nombreArticles = useMemo(() => articles.reduce((s, a) => s + a.quantite, 0), [articles])

  return (
    <PanierContext.Provider value={{ articles, ajouter, modifierQuantite, retirer, vider, total, nombreArticles }}>
      {children}
    </PanierContext.Provider>
  )
}

export function usePanier() {
  const ctx = useContext(PanierContext)
  if (!ctx) throw new Error('usePanier doit être utilisé à l\'intérieur de <PanierProvider>')
  return ctx
}
