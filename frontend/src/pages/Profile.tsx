import React, { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../api/profile'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Profile(){
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  useEffect(()=>{(async()=>{
    try{ const res = await getProfile(); setProfile(res.user || res) }catch(e){setProfile(null)}
  })()},[])

  async function onSave(e: React.FormEvent){
    e.preventDefault()
    try{ await updateProfile(profile); alert('Profilo aggiornato') }catch(err:any){ setError(err?.response?.data?.error || err.message) }
  }

  if (!profile) return <div className="page"><p className="muted">Caricamento...</p></div>

  return (
    <div className="page">
      <h2>Profilo</h2>
      <form onSubmit={onSave} style={{ maxWidth:420 }}>
        <label>Nickname</label>
        <input value={profile.nickname||''} onChange={e=>setProfile({...profile, nickname:e.target.value})} />
        <label style={{ marginTop:10 }}>Email</label>
        <input value={profile.email||''} disabled />
        <div style={{ marginTop:10 }}>
          <button type="submit">Salva</button>
          <button type="button" style={{ marginLeft: 8 }} onClick={()=>{
            try{ localStorage.removeItem('mf_token') }catch{}
            setUser(null)
            navigate('/login')
          }}>Logout</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}
