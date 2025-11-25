import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/client'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    try{
      const data = await login(email, password)
      if (data && data.token) {
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
