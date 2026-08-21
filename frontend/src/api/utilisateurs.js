import { api } from './client'

export const utilisateursApi = {
  liste: () => api.get('/api/utilisateurs'),
  creer: (donnees) => api.post('/api/utilisateurs', donnees),
  modifier: (id, donnees) => api.put(`/api/utilisateurs/${id}`, donnees),
  supprimer: (id) => api.delete(`/api/utilisateurs/${id}`),
}
