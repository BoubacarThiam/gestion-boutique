import { api } from './client'

export const authApi = {
  login: (telephone, mot_de_passe) =>
    api.post('/api/auth/login', { telephone, mot_de_passe }, { sansAuth: true }),
  moi: () => api.get('/api/auth/me'),
}
