import api from './client'

export async function createPayment(payload: { payerId?: string; participants: string[]; amount: number; currency?: string; description?: string; groupId?: string }){
  const res = await api.post('/api/payments', payload)
  return res.data?.payment || res.data?.data || res.data
}

export async function listUserPayments(userId: string){
  const res = await api.get(`/api/payments/user/${userId}`)
  return res.data?.payments || res.data?.data || res.data
}

export async function listGroupPayments(groupId: string){
  const res = await api.get(`/api/payments/group/${groupId}`)
  return res.data?.payments || res.data?.data || res.data
}

export default { createPayment, listUserPayments, listGroupPayments }
