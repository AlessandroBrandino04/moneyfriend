import api from './client'

export type Friend = { id: string; email: string; nickname?: string }

export async function listFriends(){
  const res = await api.get('/api/users/friends')
  const data = res.data
  // normalize common shapes: array, { friends: [] }, { users: [] }
  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as any).friends)) return (data as any).friends
  if (data && Array.isArray((data as any).users)) return (data as any).users
  // fallback: try to return an array property, otherwise empty
  for (const k of Object.keys(data || {})) {
    if (Array.isArray((data as any)[k])) return (data as any)[k]
  }
  return []
}

export async function addFriend(email: string){
  const res = await api.post('/api/users/friends', { email })
  return res.data
}
