import React from 'react'

export default function Home(){
  return (
    <div className="page">
      <h2>Dashboard</h2>
      <p>Benvenuto in MoneyFriend — qui ci saranno i tuoi bilanci, attività recenti e suggerimenti.</p>

      <section style={{ marginTop: 18 }}>
        <h3>Attività recenti</h3>
        <div style={{ padding: 12, background: '#fff', borderRadius: 10, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
          <p className="muted">Nessuna attività recente.</p>
        </div>
      </section>
    </div>
  )
}
