import React, { useEffect, useState } from 'react'
import { listNotifications, markRead } from '../api/notifications'
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket'

export default function Notifications(){
  const [notes, setNotes] = useState<any[]>([])

  useEffect(()=>{
    let sock: any = null

    ;(async()=>{
      try{
        const res = await listNotifications()
        let items: any[] = []
        if (Array.isArray(res)) items = res
        else if (res && Array.isArray((res as any).notifications)) items = (res as any).notifications
        else if (res && Array.isArray((res as any).data)) items = (res as any).data
        setNotes(items || [])
      }catch(e){ setNotes([]) }
    })()

    // prefer global socket created by AuthContext; fall back to connect if missing
    sock = getSocket() || connectSocket()
    if (sock) {
      sock.on('notifications.initial', (arr:any[]) => {
        setNotes(prev => {
          const map = new Map(prev.map((n:any)=>[n.id,n]))
          for (const n of arr || []) map.set(n.id, n)
          return Array.from(map.values()).sort((a:any,b:any)=> (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0))
        })
      })

      sock.on('notification', (note:any) => {
        setNotes(prev => {
          if (!note) return prev
          // avoid duplicates
          if (prev.find(p=>p.id===note.id)) return [note, ...prev.filter(p=>p.id!==note.id)]
          return [note, ...prev]
        })
      })
    }

    return () => {
      try {
        if (sock) {
          sock.off('notifications.initial')
          sock.off('notification')
        }
        // do NOT disconnect the socket here — keep a persistent global connection
      } catch (e) {
        // ignore
      }
    }
  }, [])

  async function onMark(id:string){
    try{ await markRead(id); setNotes(prev=>prev.map(n=> n.id===id?{...n, read:true}:n)) }catch(e){}
  }

  // ensure we always map over an array (some responses may be wrapped)
  const items = Array.isArray(notes)
    ? notes
    : (notes && Array.isArray((notes as any).notifications) ? (notes as any).notifications : [])

  return (
    <div className="page">
      <h2>Notifiche</h2>
      <section style={{ marginTop:12 }}>
        {items.length===0 ? <p className="muted">Nessuna notifica.</p> : (
          <ul>
            {items.map((n: any) => (
              <li key={n.id} style={{ padding:10, background:n.read? '#f3f4f6':'#fff', borderRadius:8, marginBottom:8 }}>
                <div>{n.title || n.message || (n.payload && n.payload.message) || JSON.stringify(n.payload)}</div>
                <div className="muted" style={{ fontSize:12 }}>{new Date(n.createdAt || n.ts || Date.now()).toLocaleString()}</div>
                {!n.read && <button style={{ marginTop:8 }} onClick={()=>onMark(n.id)}>Segna letta</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
