import api from './client'

export async function listNotifications(){
  const res = await api.get('/api/notifications')
  return res.data
}

export async function markRead(id: string){
  const res = await api.post(`/api/notifications/${id}/read`)
  return res.data
}
