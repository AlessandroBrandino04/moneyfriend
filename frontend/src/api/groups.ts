import api from './client'

export async function listGroups(){
  const res = await api.get('/api/users/groups')
  return res.data?.data
}

export async function joinGroup(groupId: string){
  const res = await api.post(`/api/users/groups/${groupId}/join`)
  return res.data?.data
}

export async function createGroup(payload: { name: string; description?: string }){
  const res = await api.post('/api/users/groups', payload)
  return res.data?.data
}

export async function getGroup(groupId: string){
  const res = await api.get(`/api/users/groups/${groupId}`)
  return res.data?.data
}
