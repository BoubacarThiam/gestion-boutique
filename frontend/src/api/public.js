import { api } from './client'

// Endpoints du catalogue public — aucune authentification requise.
export const catalogueApi = {
  parametres: () => api.get('/api/public/parametres', { sansAuth: true }),
  categories: () => api.get('/api/public/categories', { sansAuth: true }),
  produits: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/public/produits${qs ? '?' + qs : ''}`, { sansAuth: true })
  },
  produit: (id) => api.get(`/api/public/produits/${id}`, { sansAuth: true }),
  creerCommande: (donnees) => api.post('/api/public/commandes', donnees, { sansAuth: true }),
}
