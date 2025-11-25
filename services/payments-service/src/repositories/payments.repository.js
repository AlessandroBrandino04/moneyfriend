const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPayment({ payerId, participants, amount, currency = 'EUR', description, groupId }) {
  return prisma.payment.create({ data: { payerId: String(payerId), participants, amount: Number(amount), currency, description, groupId } });
}

async function getPaymentsForUser(userId) {
  // payments where user is payer or in participants
  const all = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
  return all.filter(p => p.payerId === String(userId) || (Array.isArray(p.participants) ? p.participants.includes(String(userId)) : false));
}

async function getPaymentsForGroup(groupId) {
  return prisma.payment.findMany({ where: { groupId: groupId ? String(groupId) : undefined }, orderBy: { createdAt: 'desc' } });
}

module.exports = { createPayment, getPaymentsForUser, getPaymentsForGroup };
