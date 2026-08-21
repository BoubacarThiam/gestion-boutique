import { api } from './client'

export const dashboardApi = {
  resume: () => api.get('/api/dashboard'),
}
