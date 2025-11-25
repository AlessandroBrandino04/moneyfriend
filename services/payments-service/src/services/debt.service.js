const debtRepo = require('../repositories/debt.repository');
const groupDebtRepo = require('../repositories/groupDebt.repository');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toCents(amount) {
  // amount can be in float (e.g., 12.34) or integer cents
  if (Number.isInteger(amount)) return amount;
  return Math.round(Number(amount) * 100);
}

async function createSimpleDebt({ creditorId, debtorId, amount }) {
  const cents = toCents(amount);
  // authorization: creditor and debtor must be friends
  const areFriends = await checkFriendship(creditorId, debtorId);
  if (!areFriends) throw new Error('Users are not friends; cannot create simple debt');
  const r = await debtRepo.upsertIncrementDebt(creditorId, debtorId, cents);
  return r;
}

// participants: [{ userId, percent }]
async function recordSplitPayment({ payerId, participants, totalAmount }) {
  if (!payerId) throw new Error('payerId required');
  if (!Array.isArray(participants) || participants.length === 0) throw new Error('participants required');
  const cents = toCents(totalAmount);
  // for each participant compute their share; payer paying means others owe payer their share
  for (const p of participants) {
    const userId = String(p.userId);
    const percent = Number(p.percent || 0);
    const share = Math.round(cents * (percent / 100));
    if (userId === String(payerId)) continue; // payer doesn't owe to self
    // authorization: payer and participant must be friends
    const areFriends = await checkFriendship(payerId, userId);
    if (!areFriends) throw new Error(`Payer and participant ${userId} are not friends`);
    await debtRepo.upsertIncrementDebt(payerId, userId, share);
  }
  // record settlement/history
  await prisma.settlement.create({ data: { fromUser: payerId, toUser: payerId, amount: cents } }).catch(() => {});
  return { ok: true };
}

// shares: [{ userId, percent }]
async function recordGroupPayment({ payerId, groupId, totalAmount, shares }) {
  if (!groupId) throw new Error('groupId required');
  if (!payerId) throw new Error('payerId required');
  const cents = toCents(totalAmount);
  // authorization: payer must be member of the group
  const isMember = await checkMembership(payerId, groupId);
  if (!isMember) throw new Error('Payer is not member of the group');

  for (const s of shares) {
    const userId = String(s.userId);
    const percent = Number(s.percent || 0);
    const share = Math.round(cents * (percent / 100));
    if (userId === String(payerId)) continue;
    // authorization: participants must be members of the group
    const partIsMember = await checkMembership(userId, groupId);
    if (!partIsMember) throw new Error(`Participant ${userId} is not member of group ${groupId}`);
    await groupDebtRepo.upsertIncrementGroupDebt(groupId, payerId, userId, share);
  }
  // record history settlement placeholder
  await prisma.settlement.create({ data: { fromUser: payerId, toUser: payerId, amount: cents } }).catch(() => {});
  return { ok: true };
}

// get net balance between two users (positive = other owes you)
async function getBalanceBetween(userA, userB) {
  const [aToB, bToA] = await Promise.all([
    debtRepo.getDebt(userA, userB),
    debtRepo.getDebt(userB, userA)
  ]);
  const aAmount = aToB ? aToB.amount : 0;
  const bAmount = bToA ? bToA.amount : 0;
  const net = aAmount - bAmount; // positive => userB owes userA? careful: aAmount is creditor=userA debtor=userB => userB owes userA
  if (net > 0) return { creditor: userA, debtor: userB, amount: net };
  if (net < 0) return { creditor: userB, debtor: userA, amount: -net };
  return { creditor: null, debtor: null, amount: 0 };
}

async function getGroupBalances(groupId, userId) {
  const list = await groupDebtRepo.listGroupDebtsForUser(groupId, userId);
  // transform into map counterpart -> net amount (positive means counterpart owes user)
  const map = {};
  for (const g of list) {
    const key = (g.creditorId === String(userId)) ? g.debtorId : g.creditorId;
    const isCreditor = g.creditorId === String(userId);
    const amt = g.amount;
    if (!map[key]) map[key] = 0;
    // if user is creditor, other owes user => add; if user is debtor, user owes other => subtract
    map[key] += isCreditor ? amt : -amt;
  }
  // return array with normalized direction
  const result = [];
  for (const [other, amt] of Object.entries(map)) {
    if (amt > 0) result.push({ creditor: userId, debtor: other, amount: amt });
    else if (amt < 0) result.push({ creditor: other, debtor: userId, amount: -amt });
  }
  return result;
}

module.exports = { createSimpleDebt, recordSplitPayment, recordGroupPayment, getBalanceBetween, getGroupBalances };

// Authorization helpers using local cached data (synced from users-service)
async function checkFriendship(userA, userB) {
  if (!userA || !userB) return false;
  // try both directions
  const f1 = await prisma.friendship.findUnique({ where: { user1Id_user2Id: { user1Id: String(userA), user2Id: String(userB) } } }).catch(() => null);
  const f2 = await prisma.friendship.findUnique({ where: { user1Id_user2Id: { user1Id: String(userB), user2Id: String(userA) } } }).catch(() => null);
  const f = f1 || f2;
  return !!(f && !f.isDeleted && (f.status === 'ACCEPTED' || f.status === 'accepted'));
}

async function checkMembership(userId, groupId) {
  if (!userId || !groupId) return false;
  const m = await prisma.membership.findUnique({ where: { userId_groupId: { userId: String(userId), groupId: String(groupId) } } ).catch(() => null);
  return !!(m && !m.isDeleted);
}
