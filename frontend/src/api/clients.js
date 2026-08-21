import { api } from './client'

export const clientsApi = {
  liste: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/clients${qs ? '?' + qs : ''}`)
  },
  detail: (id) => api.get(`/api/clients/${id}`),
}
