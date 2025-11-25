require('dotenv').config();
const amqp = require('amqplib');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

async function startUserSync() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    const exchange = 'users';
    await ch.assertExchange(exchange, 'fanout', { durable: true });
    const q = await ch.assertQueue('payments.user-sync.queue', { durable: true });
    await ch.bindQueue(q.queue, exchange, '');
    console.log('UserSync subscriber listening to exchange', exchange);
    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        const type = payload.type || payload.event;
        const data = payload.data || payload.payload || payload;
        console.log('UserSync received', type, data);
        if (type === 'user.created' || type === 'user.updated') {
          if (data && data.id) {
            await prisma.user.upsert({ where: { id: String(data.id) }, update: { nickname: data.nickname || null }, create: { id: String(data.id), nickname: data.nickname || null } });
          }
        } else if (type === 'group.created' || type === 'group.updated') {
          if (data && data.id) {
            await prisma.group.upsert({ where: { id: String(data.id) }, update: { name: data.name || '' }, create: { id: String(data.id), name: data.name || '' } });
          }
        } else if (type === 'membership.created' || type === 'membership.updated' || type === 'membership.join') {
          // Expect payload: { id?, userId, groupId, role }
          if (data && data.userId && data.groupId) {
            await prisma.membership.upsert({
              where: { userId_groupId: { userId: String(data.userId), groupId: String(data.groupId) } },
              update: { role: data.role || 'member', isDeleted: false },
              create: { userId: String(data.userId), groupId: String(data.groupId), role: data.role || 'member' }
            });
          }
        } else if (type === 'membership.left' || type === 'membership.removed') {
          if (data && data.userId && data.groupId) {
            await prisma.membership.updateMany({ where: { userId: String(data.userId), groupId: String(data.groupId) }, data: { isDeleted: true } });
          }
        } else if (type === 'friendship.accepted' || type === 'friendship.created') {
          // Expect payload: { id?, user1Id, user2Id, status }
          if (data && data.user1Id && data.user2Id) {
            const a = String(data.user1Id); const b = String(data.user2Id);
            // store canonical ordering to respect unique constraint (user1Id,user2Id)
            await prisma.friendship.upsert({
              where: { user1Id_user2Id: { user1Id: a, user2Id: b } },
              update: { status: data.status || 'ACCEPTED', isDeleted: false },
              create: { user1Id: a, user2Id: b, status: data.status || 'ACCEPTED' }
            });
          }
        } else if (type === 'friendship.removed' || type === 'friendship.blocked') {
          if (data && data.user1Id && data.user2Id) {
            await prisma.friendship.updateMany({ where: { user1Id: String(data.user1Id), user2Id: String(data.user2Id) }, data: { isDeleted: true } });
          }
        }
        ch.ack(msg);
      } catch (e) {
        console.error('UserSync processing error', e);
        try { ch.nack(msg, false, false); } catch (err) { console.error('nack failed', err); }
      }
    }, { noAck: false });
  } catch (e) {
    console.error('Failed to start UserSync subscriber', e);
    setTimeout(startUserSync, 5000);
  }
}

module.exports = { startUserSync };
