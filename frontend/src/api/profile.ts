import api from './client'

export async function getProfile(){
  const res = await api.get('/api/users/me')
  return res.data
}

export async function updateProfile(payload: any){
  const res = await api.put('/api/users/me', payload)
  return res.data
}
