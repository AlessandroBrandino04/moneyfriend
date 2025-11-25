import { io, type Socket } from 'socket.io-client'

const env = (import.meta as any)?.env
const API_BASE = (env && env.VITE_API_BASE) || 'http://localhost:8000'

// If API_BASE contains /api prefix (gateway), remove it for socket origin
const SOCKET_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

let socket: Socket | null = null

export function connectSocket(): Socket | null {
  if (typeof window === 'undefined') return null
  if (socket && socket.connected) return socket

  const token = (() => {
    try { return localStorage.getItem('mf_token') } catch (e) { return null }
  })()

  socket = io(SOCKET_ORIGIN, {
    auth: { token },
    transports: ['websocket', 'polling']
  })

  // basic logging for debug
  socket.on('connect', () => console.debug('Socket connected', socket?.id))
  socket.on('connect_error', (err:any) => console.warn('Socket connect_error', err && err.message ? err.message : err))

  return socket
}

export function disconnectSocket() {
  try {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  } catch (e) {
    // ignore
  }
}

export function getSocket(): Socket | null { return socket }

export default { connectSocket, disconnectSocket, getSocket }
