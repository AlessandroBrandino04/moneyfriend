import React, { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../api/client'
import { connectSocket, disconnectSocket } from '../lib/socket'

type User = { id: string; email: string; nickname?: string }

const AuthContext = createContext<{ user: User | null; setUser: (u: User | null) => void; loading: boolean }>({ user: null, setUser: () => {}, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }){
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() =>{
    (async () =>{
      try{
        const me = await getMe()
        // backend may return { data: user } or { user: user }
        const u = me?.data || me?.user || null
        if (u) setUser(u)
      } catch (e){
        setUser(null)
      } finally { setLoading(false) }
    })()
  }, [])

  // Keep a persistent socket connection while the user is logged in
  useEffect(() => {
    if (user) {
      try { connectSocket() } catch (e) { /* ignore */ }
    } else {
      try { disconnectSocket() } catch (e) { /* ignore */ }
    }
  }, [user])

  return <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}
