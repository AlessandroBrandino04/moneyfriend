import api from './client'

export async function getUser(userId: string){
  const res = await api.get(`/api/users/${userId}`)
  return res.data?.data
}

export default { getUser }
