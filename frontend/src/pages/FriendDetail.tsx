import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getUser } from '../api/users'
import { listUserPayments, createPayment } from '../api/payments'
import { useAuth } from '../contexts/AuthContext'

export default function FriendDetail(){
  const { id } = useParams()
  const { user } = useAuth()
  const [friend, setFriend] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{(async()=>{
    if (!id) return
    try{ const f = await getUser(id); setFriend(f) }catch(e){ setFriend(null) }
    try{ const p = await listUserPayments(id); setPayments(Array.isArray(p) ? p : (p?.payments||[])) }catch(e){ setPayments([]) }
  })()},[id])

  async function onPay(e: React.FormEvent){
    e.preventDefault(); setError(null)
    try{
      const payload = { participants: [id as string], amount: parseFloat(amount), description: desc }
      await createPayment(payload)
      setAmount(''); setDesc('')
      const p = await listUserPayments(id as string)
      setPayments(Array.isArray(p) ? p : (p?.payments||[]))
    }catch(err:any){ setError(err?.response?.data?.error || err.message) }
  }

  if (!id) return <div className="page">Utente non specificato</div>

  return (
    <div className="page">
      <h2>Profilo amico</h2>
      {friend ? (
        <div>
          <p><strong>{friend.nickname || friend.email}</strong></p>
          <p className="muted">{friend.name} {friend.surname}</p>
        </div>
      ) : <p className="muted">Caricamento...</p>}

      <section style={{ marginTop: 12 }}>
        <h3>Pagamenti con questo utente</h3>
        {payments.length === 0 ? <p className="muted">Nessun pagamento.</p> : (
          <ul>{payments.map((p:any)=> <li key={p.id}>{p.description || 'Pagamento'} — {p.amount}</li>)}</ul>
        )}
      </section>

      <section style={{ marginTop: 12 }}>
        <h3>Aggiungi pagamento</h3>
        <form onSubmit={onPay}>
          <input placeholder="Importo" value={amount} onChange={e=>setAmount(e.target.value)} required />
          <input placeholder="Descrizione" value={desc} onChange={e=>setDesc(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button type="submit">Registra pagamento</button>
          </div>
        </form>
        {error && <div className="error">{error}</div>}
      </section>
    </div>
  )
}
