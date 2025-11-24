require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');

const PORT = process.env.PORT || 6000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

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

app.get('/api/notifications/health', (req, res) => res.json({ ok: true }));

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

app.listen(PORT, () => console.log('Notifications service listening on', PORT));
