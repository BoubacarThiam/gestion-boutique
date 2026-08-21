import { api } from './client'

export const produitsApi = {
  liste: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/produits${qs ? '?' + qs : ''}`)
  },
  detail: (id) => api.get(`/api/produits/${id}`),
  creer: (donnees) => api.post('/api/produits', donnees),
  creerAvecImage: (formData) => api.postFormData('/api/produits', formData),
  modifier: (id, donnees) => api.put(`/api/produits/${id}`, donnees),
  changerImage: (id, formData) => api.postFormData(`/api/produits/${id}/image`, formData),
  supprimer: (id) => api.delete(`/api/produits/${id}`),
}
