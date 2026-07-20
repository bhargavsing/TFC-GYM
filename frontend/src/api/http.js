import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('tfc_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true
      try {
        const refresh = await http.post('/api/auth/refresh')
        window.localStorage.setItem('tfc_access_token', refresh.data.accessToken)
        original.headers.Authorization = `Bearer ${refresh.data.accessToken}`
        return http(original)
      } catch {
        window.localStorage.removeItem('tfc_access_token')
      }
    }
    throw error
  },
)

export function unwrap(response) {
  return response.data
}
