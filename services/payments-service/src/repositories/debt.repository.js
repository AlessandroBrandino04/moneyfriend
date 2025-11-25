const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertIncrementDebt(creditorId, debtorId, deltaCents) {
  creditorId = String(creditorId); debtorId = String(debtorId);
  // upsert by unique pair
  return prisma.debt.upsert({
    where: { creditorId_debtorId: { creditorId, debtorId } },
    update: {
      amount: { increment: deltaCents },
      isSettled: false,
    },
    create: {
      creditorId,
      debtorId,
      amount: deltaCents,
      currency: 'EUR',
      isSettled: false,
    }
  });
}

async function setDebtAmount(creditorId, debtorId, amountCents, isSettled = false) {
  creditorId = String(creditorId); debtorId = String(debtorId);
  return prisma.debt.upsert({
    where: { creditorId_debtorId: { creditorId, debtorId } },
    update: { amount: amountCents, isSettled },
    create: { creditorId, debtorId, amount: amountCents, currency: 'EUR', isSettled }
  });
}

async function getDebt(creditorId, debtorId) {
  return prisma.debt.findUnique({ where: { creditorId_debtorId: { creditorId: String(creditorId), debtorId: String(debtorId) } } });
}

async function listDebtsForUser(userId) {
  userId = String(userId);
  return prisma.debt.findMany({ where: { OR: [{ creditorId: userId }, { debtorId: userId }] } });
}

module.exports = { upsertIncrementDebt, setDebtAmount, getDebt, listDebtsForUser };
