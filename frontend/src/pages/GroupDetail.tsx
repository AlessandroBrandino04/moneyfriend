import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getGroup } from '../api/groups'
import { listGroupPayments, createPayment } from '../api/payments'

export default function GroupDetail(){
  const { id } = useParams()
  const [group, setGroup] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{(async()=>{
    if (!id) return
    try{ const g = await getGroup(id); setGroup(g.group || g) }catch(e){ setGroup(null) }
    try{ const p = await listGroupPayments(id); setPayments(Array.isArray(p) ? p : (p?.payments||[])) }catch(e){ setPayments([]) }
  })()},[id])

  async function onAddPayment(e: React.FormEvent){
    e.preventDefault(); setError(null)
    try{
      // build participants as group members except payer (gateway will set payer)
      const participantIds = (group?.members || []).map((m:any)=> m.userId)
      const payload = { participants: participantIds, amount: parseFloat(amount), description: desc, groupId: id }
      await createPayment(payload)
      setAmount(''); setDesc('')
      const p = await listGroupPayments(id as string)
      setPayments(Array.isArray(p) ? p : (p?.payments||[]))
    }catch(err:any){ setError(err?.response?.data?.error || err.message) }
  }

  if (!id) return <div className="page">Gruppo non specificato</div>

  return (
    <div className="page">
      <h2>Gruppo</h2>
      {group ? (
        <div>
          <p><strong>{group.name}</strong></p>
          <p className="muted">{group.description}</p>
          <h4>Membri</h4>
          <ul>{(group.members || []).map((m:any)=> <li key={m.id}>{m.role} — {m.userId}</li>)}</ul>
        </div>
      ) : <p className="muted">Caricamento...</p>}

      <section style={{ marginTop: 12 }}>
        <h3>Pagamenti del gruppo</h3>
        {payments.length === 0 ? <p className="muted">Nessun pagamento di gruppo.</p> : (
          <ul>{payments.map((p:any)=> <li key={p.id}>{p.description || 'Pagamento'} — {p.amount}</li>)}</ul>
        )}
      </section>

      <section style={{ marginTop: 12 }}>
        <h3>Aggiungi pagamento di gruppo</h3>
        <form onSubmit={onAddPayment}>
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
