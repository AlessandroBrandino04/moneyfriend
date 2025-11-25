require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 6000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Express app (for REST endpoints)
const app = express();
// Capture raw body for debugging parse errors and normal parsing
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf && buf.toString();
    } catch (e) {
      req.rawBody = undefined;
    }
  }
}));

// Error handler for JSON parse errors to log raw body
app.use((err, req, res, next) => {
  if (err) {
    console.error('JSON parse error on /api/notifications, rawBody=', req.rawBody, 'error=', err && err.message ? err.message : err);
    return res.status(400).send('Bad Request: invalid JSON');
  }
  next();
});

// Log incoming requests to socket.io endpoints (useful to debug polling handshakes)
app.use((req, res, next) => {
  try {
    if (req.url && req.url.startsWith('/socket.io')) {
      console.log('Incoming socket HTTP request:', req.method, req.url, 'headers=', JSON.stringify(req.headers));
    }
  } catch (e) {
    // non-blocking
  }
  next();
});

let channel = null;

async function connectRabbit() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    channel = await conn.createChannel();
    // ensure exchange exists
    await channel.assertExchange('notifications', 'fanout', { durable: true });
    console.log('Connected to RabbitMQ at', RABBITMQ_URL);
  } catch (err) {
    console.error('Failed to connect to RabbitMQ', err);
    setTimeout(connectRabbit, 5000);
  }
}

connectRabbit();

// Start a persistent consumer that listens forever to the 'notifications' exchange
// and forwards messages to connected Socket.IO clients (and stores them).
async function startConsumer() {
  // wait until channel is ready
  if (!channel) {
    setTimeout(startConsumer, 200);
    return;
  }

  const queueName = 'notifications.queue';
  // durable queue so messages survive broker restart
  await channel.assertQueue(queueName, { durable: true });
  // bind to the 'notifications' exchange (fanout)
  await channel.bindQueue(queueName, 'notifications', '');

  console.log('Notifications consumer listening on', queueName);

  // Start consuming messages. We use manual ack to ensure reliability.
  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());

      // Determine recipients. Expect payload to contain `userId` or `recipients` array.
      let recipients = [];
      if (payload.userId) recipients = [String(payload.userId)];
      else if (Array.isArray(payload.recipients)) recipients = payload.recipients.map(String);
      else if (payload.target === 'all') recipients = null; // broadcast

      const notification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
        type: payload.type,
        payload: payload.payload || payload,
        ts: Date.now(),
        read: false
      };

      if (recipients === null) {
        // broadcast to all connected clients
        io.emit('notification', notification);
      } else {
        // deliver to each recipient: persist via Prisma and emit to their room
        for (const userId of recipients) {
          try {
            const saved = await notificationsRepo.saveNotification({ userId, type: notification.type, payload: notification.payload });
            io.to(`user:${userId}`).emit('notification', saved);
          } catch (e) {
            console.error('Failed to persist notification for user', userId, e);
          }
        }
      }

      // acknowledge after successful processing
      channel.ack(msg);
    } catch (err) {
      console.error('Error processing notification message', err);
      // on error, nack without requeue -> goes to DLQ if configured
      try { channel.nack(msg, false, false); } catch (e) { console.error('nack failed', e); }
    }
  }, { noAck: false });
}

// start consumer once the channel is ready
startConsumer();

app.get('/api/notifications/health', (req, res) => res.json({ ok: true }));

// Helper to extract user id from Authorization header (expects Bearer token)
function getUserIdFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub || decoded.userId || decoded.id || null;
  } catch (err) {
    return null;
  }
}

// Read notifications for authenticated user
app.get('/api/notifications', (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  (async () => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const results = await notificationsRepo.getNotificationsForUser(userId, { unreadOnly });
      return res.json({ success: true, notifications: results });
    } catch (e) {
      console.error('Failed to fetch notifications for', userId, e);
      return res.status(500).json({ success: false, error: 'Fetch failed' });
    }
  })();
});

// Mark a notification as read for the authenticated user
app.post('/api/notifications/mark-read', (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ success: false, error: 'Missing id' });
  (async () => {
    try {
      const updated = await notificationsRepo.markAsRead(userId, id);
      if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true });
    } catch (e) {
      console.error('Failed to mark read', e);
      return res.status(500).json({ success: false, error: 'Mark failed' });
    }
  })();
});

// Publish a notification event to RabbitMQ
app.post('/api/notifications', async (req, res) => {
  const payload = req.body;
  console.debug('POST /api/notifications headers=', req.headers, 'rawBody=', req.rawBody, 'parsed=', payload);
  if (!payload || !payload.type) return res.status(400).json({ success: false, error: 'Missing type' });
  try {
    if (!channel) throw new Error('No rabbit channel');
    const msg = Buffer.from(JSON.stringify(payload));
    // publish to 'notifications' exchange
    channel.publish('notifications', '', msg, { persistent: true });
    return res.status(201).json({ success: true });
  } catch (e) {
    console.error('Publish error', e);
    return res.status(500).json({ success: false, error: 'Publish failed' });
  }
});

// Simple consumer endpoint for debugging (drains a dedicated queue)
app.post('/api/notifications/consume-once', async (req, res) => {
  try {
    if (!channel) throw new Error('No rabbit channel');
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, 'notifications', '');
    const msgs = [];
    // consume for a short time
    const consumer = await channel.consume(q.queue, (m) => {
      if (m !== null) {
        msgs.push(JSON.parse(m.content.toString()));
        channel.ack(m);
      }
    }, { noAck: false });

    // wait 300ms to collect messages
    await new Promise((r) => setTimeout(r, 300));
    await channel.cancel(consumer.consumerTag);
    return res.json({ success: true, messages: msgs });
  } catch (e) {
    console.error('Consume error', e);
    return res.status(500).json({ success: false, error: 'Consume failed' });
  }
});

// We'll create an HTTP server and attach Socket.IO to it so the same process
// can both serve REST endpoints and maintain WebSocket connections.
const server = http.createServer(app);
const io = new Server(server, {
  // allow CORS from any origin for dev; tighten in production
  cors: { origin: '*' }
});

// Use Prisma-backed repository for persistence
const notificationsRepo = require('./repositories/notifications.repository');

// Socket.IO auth middleware: verifies JWT sent during handshake
io.use((socket, next) => {
  try {
    // Expect token in handshake auth, e.g. io({ auth: { token } })
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: token missing'));
    const decoded = jwt.verify(token, JWT_SECRET);
    // attach user info to socket for later use
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

// Engine-level connection error logging (handshake/polling failures)
try {
  if (io && io.engine && typeof io.engine.on === 'function') {
    io.engine.on('connection_error', (err) => {
      console.error('Engine connection_error:', err && err.message ? err.message : err, err);
    });
  }
} catch (e) {
  console.error('Failed to attach engine connection_error handler', e);
}

// When a client connects, join them to a room specific to their user id
io.on('connection', (socket) => {
  const userId = socket.user && (socket.user.sub || socket.user.userId || socket.user.id);
  if (!userId) {
    socket.disconnect(true);
    return;
  }
  const room = `user:${userId}`;
  socket.join(room);
  console.log(`Socket connected and joined room ${room}`);

  // On connect send unread notifications persisted in DB
  (async () => {
    try {
      const unread = await notificationsRepo.getNotificationsForUser(userId, { unreadOnly: true });
      if (unread && unread.length) socket.emit('notifications.initial', unread);
    } catch (e) {
      console.error('Failed to load unread notifications for', userId, e);
    }
  })();

  socket.on('disconnect', () => {
    console.log('Socket disconnected for user', userId);
  });
});

// Start the HTTP + Socket.IO server
server.listen(PORT, () => console.log('Notifications service listening on', PORT));
