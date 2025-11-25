const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function saveNotification({ userId, type, payload }) {
  return prisma.notification.create({ data: { userId: userId ? String(userId) : null, type, payload } });
}

async function getNotificationsForUser(userId, { unreadOnly = false } = {}) {
  const where = { userId: String(userId) };
  if (unreadOnly) where.read = false;
  return prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function markAsRead(userId, id) {
  // ensure the notification belongs to the user before marking
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || String(n.userId) !== String(userId)) return null;
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

module.exports = { saveNotification, getNotificationsForUser, markAsRead };
