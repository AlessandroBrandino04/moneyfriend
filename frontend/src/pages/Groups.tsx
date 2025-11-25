import React, { useEffect, useState } from 'react'
import { listGroups, joinGroup, createGroup } from '../api/groups'
import { Link } from 'react-router-dom'

export default function Groups(){
  const [groups, setGroups] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async ()=>{
    try{ const res = await listGroups(); setGroups(res || []) }catch(e){setGroups([])}
  }

  useEffect(()=>{(async()=>{ await load() })()},[])

  async function onJoin(id: string){
    setError(null)
    try{ await joinGroup(id); alert('Richiesta inviata') }catch(err:any){ setError(err?.response?.data?.error || err.message) }
  }

  async function onCreate(e: React.FormEvent){
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    try{
      const res = await createGroup({ name, description })
      setSuccess('Gruppo creato')
      setName(''); setDescription('')
      await load()
    }catch(err:any){ setError(err?.response?.data?.error || err.message) }
    setLoading(false)
  }

  return (
    <div className="page">
      <h2>Gruppi</h2>

      <section style={{ marginTop: 12 }}>
        <h3>Crea un nuovo gruppo</h3>
        <form onSubmit={onCreate} style={{ marginBottom: 12 }}>
          <div>
            <input placeholder="Nome del gruppo" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div style={{ marginTop: 8 }}>
            <input placeholder="Descrizione (opzionale)" value={description} onChange={e=>setDescription(e.target.value)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crea gruppo'}</button>
          </div>
        </form>
        {success && <div className="muted">{success}</div>}
      </section>

      <section style={{ marginTop: 12 }}>
        <h3>I tuoi gruppi</h3>
        {groups.length === 0 ? <p className="muted">Non sei in nessun gruppo.</p> : (
          <ul>
            {groups.map(g=> <li key={g.id}><Link to={`/groups/${g.id}`}>{g.name}</Link> <button style={{ marginLeft: 8 }} onClick={()=>onJoin(g.id)}>Partecipa</button></li>)}
          </ul>
        )}
      </section>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
