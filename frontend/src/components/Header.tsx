import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Header(){
  const { user } = useAuth()
  return (
    <header style={{ borderBottom: '1px solid #e6edf3', background: 'white' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>MoneyFriend</Link>
          <nav style={{ display: 'flex', gap: 14 }}>
            {user ? (
              <>
                <Link to="/friends">Amici</Link>
                <Link to="/groups">Gruppi</Link>
                <Link to="/notifications">Notifiche</Link>
                <Link to="/profile">Profilo</Link>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Registrati</Link>
              </>
            )}
          </nav>
        </div>
        <div>
          {user ? <span style={{ fontWeight: 600 }}>{user.nickname || user.email}</span> : null}
        </div>
      </div>
    </header>
  )
}
