const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertIncrementGroupDebt(groupId, creditorId, debtorId, deltaCents) {
  groupId = String(groupId); creditorId = String(creditorId); debtorId = String(debtorId);
  return prisma.groupDebt.upsert({
    where: { groupId_creditorId_debtorId: { groupId, creditorId, debtorId } },
    update: { amount: { increment: deltaCents } },
    create: { groupId, creditorId, debtorId, amount: deltaCents, currency: 'EUR' }
  });
}

async function setGroupDebtAmount(groupId, creditorId, debtorId, amountCents) {
  groupId = String(groupId); creditorId = String(creditorId); debtorId = String(debtorId);
  return prisma.groupDebt.upsert({
    where: { groupId_creditorId_debtorId: { groupId, creditorId, debtorId } },
    update: { amount: amountCents },
    create: { groupId, creditorId, debtorId, amount: amountCents, currency: 'EUR' }
  });
}

async function getGroupDebt(groupId, creditorId, debtorId) {
  return prisma.groupDebt.findUnique({ where: { groupId_creditorId_debtorId: { groupId: String(groupId), creditorId: String(creditorId), debtorId: String(debtorId) } } });
}

async function listGroupDebtsForUser(groupId, userId) {
  userId = String(userId); groupId = String(groupId);
  return prisma.groupDebt.findMany({ where: { groupId, OR: [{ creditorId: userId }, { debtorId: userId }] } });
}

module.exports = { upsertIncrementGroupDebt, setGroupDebtAmount, getGroupDebt, listGroupDebtsForUser };
