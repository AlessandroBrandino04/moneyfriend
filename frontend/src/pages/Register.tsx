import React, { useState } from 'react'
import { register } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    try{
      await register({ email, password, nickname })
      nav('/login')
    } catch (err: any){
      setError(err?.response?.data?.error || err.message || 'Registration failed')
    }
  }

  return (
    <div className="page">
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label><br/>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Nickname</label><br/>
          <input value={nickname} onChange={e => setNickname(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Name</label><br/>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Surname</label><br/>
          <input value={surname} onChange={e => setSurname(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Password</label><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Register</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}
