import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getMe } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const { setUser } = useAuth()

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    try{
      const data = await login(email, password)
      if (data && (data.token || data.user)) {
        // refresh current user and set in context
        try{
          const me = await getMe()
          // backend may return { data: user } or { user: user }
          const u = me?.data || me?.user || null
          if (u) setUser(u)
        } catch {}
        nav('/')
      }
    } catch (err: any){
      setError(err?.response?.data?.error || err.message || 'Login failed')
    }
  }

  return (
    <div className="page">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label><br/>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Password</label><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Login</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}
