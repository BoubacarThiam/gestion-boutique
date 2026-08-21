import { api } from './client'

export const categoriesApi = {
  liste: () => api.get('/api/categories'),
  creer: (donnees) => api.post('/api/categories', donnees),
  modifier: (id, donnees) => api.put(`/api/categories/${id}`, donnees),
  supprimer: (id) => api.delete(`/api/categories/${id}`),
}
