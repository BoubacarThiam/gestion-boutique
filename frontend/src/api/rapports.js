import { api } from './client'

export const rapportsApi = {
  ventes: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/rapports/ventes${qs ? '?' + qs : ''}`)
  },
  topProduits: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/rapports/top-produits${qs ? '?' + qs : ''}`)
  },
  valeurStock: () => api.get('/api/rapports/valeur-stock'),
}
