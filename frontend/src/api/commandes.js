import { api } from './client'

export const commandesApi = {
  liste: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/commandes${qs ? '?' + qs : ''}`)
  },
  detail: (id) => api.get(`/api/commandes/${id}`),
  changerStatut: (id, statut) => api.put(`/api/commandes/${id}/statut`, { statut }),
}
