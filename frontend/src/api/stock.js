import { api } from './client'

export const stockApi = {
  mouvements: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/stock/mouvements${qs ? '?' + qs : ''}`)
  },
  enregistrerMouvement: (donnees) => api.post('/api/stock/mouvements', donnees),
  alertes: () => api.get('/api/stock/alertes'),
}
