import axios, { type InternalAxiosRequestConfig } from 'axios'

const env = (import.meta as any)?.env
const API_BASE = (env && env.VITE_API_BASE) || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mf_token') : null
    if (token) {
      cfg.headers = { ...(cfg.headers as any || {}), Authorization: `Bearer ${token}` }
    }
  } catch (e) {
    // ignore (e.g. during SSR)
  }
  return cfg
})

export type LoginResponse = { token: string; user?: any }

export async function login(email: string, password: string): Promise<LoginResponse> {
    console.log('Attempting login for email:', email)
    // Chiamata al gateway API
    //per ora log se funziona
    const res = await api.post('/api/users/login', { email, password })
    console.log('Response data:', res.data)
    console.log('Response token:', res.data?.data?.token)
    if (res.data && res.data.data.token) {
        //log
        console.log('Login successful, token received')
     try { localStorage.setItem('mf_token', res.data.data.token) } catch {}
    }
  // return the inner payload (e.g. { token, user }) for convenience
  return res.data?.data || res.data
}

export async function register(payload: { email: string; password: string; nickname?: string ; name?: string ; surname?: string  }) {
  const res = await api.post('/api/users/register', payload)
  return res.data
}

export async function getMe(){
  const res = await api.get('/api/users/me')
  return res.data
}

export default api
