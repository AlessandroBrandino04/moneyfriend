import React, { useEffect, useState } from 'react'
import { listFriends, addFriend } from '../api/friends'
import { Link } from 'react-router-dom'

export default function Friends(){
  const [friends, setFriends] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{(async()=>{
    try{ const res = await listFriends();
      const arr = Array.isArray(res) ? res : (res && (res.friends || res.users)) || []
      setFriends(arr || [])
    }catch(e){setFriends([])}
  })()},[])

  async function onAdd(e: React.FormEvent){
    e.preventDefault()
    try{
      const res = await addFriend(email)
      setFriends(prev=>[...prev, res])
      setEmail('')
    }catch(err:any){ setError(err?.response?.data?.error || err.message) }
  }

  return (
    <div className="page">
      <h2>Amici</h2>
      <form onSubmit={onAdd} style={{ maxWidth:420 }}>
        <label>Invita / Aggiungi per email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button type="submit">Aggiungi</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>

      <section style={{ marginTop: 18 }}>
        {(!Array.isArray(friends) || friends.length === 0) ? <p className="muted">Nessun amico ancora.</p> : (
          <ul>
            {friends.map((f:any)=> <li key={f.id}><Link to={`/friends/${f.id}`}>{f.nickname || f.email}</Link></li>)}
          </ul>
        )}
      </section>
    </div>
  )
}
