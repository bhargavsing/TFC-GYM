import { create } from 'zustand'
import { http, unwrap } from '../api/http.js'

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: window.localStorage.getItem('tfc_access_token'),
  isAuthenticated: Boolean(window.localStorage.getItem('tfc_access_token')),
  isLoadingAuth: false,
  async login(username, password) {
    let data
    try {
      data = await http.post('/api/admin/login', { username, password }).then(unwrap)
    } catch (error) {
      throw new Error(error.response?.data?.detail ?? error.response?.data?.message ?? 'Admin login failed')
    }
    window.localStorage.setItem('tfc_access_token', data.accessToken)
    set({ user: data.admin, accessToken: data.accessToken, isAuthenticated: true })
    return data.admin
  },
  async loadMe() {
    set({ isLoadingAuth: true })
    try {
      const data = await http.get('/api/admin/me').then(unwrap)
      set({ user: data, isAuthenticated: true, isLoadingAuth: false })
      return data
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoadingAuth: false })
      throw error
    }
  },
  async logout() {
    await http.post('/api/admin/logout').catch(() => {})
    window.localStorage.removeItem('tfc_access_token')
    set({ user: null, accessToken: null, isAuthenticated: false, isLoadingAuth: false })
  },
}))
