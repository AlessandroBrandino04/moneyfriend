const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || process.env.NOTIFICATIONS_BROKER_URL || 'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE = process.env.NOTIFICATIONS_EXCHANGE || 'notifications';

let connection = null;
let channel = null;
let connecting = false;

async function connect() {
  if (channel) return channel;
  if (connecting) return;
  connecting = true;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createConfirmChannel();
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
    connection.on('error', (err) => console.error('RabbitMQ notif conn error', err));
    connection.on('close', () => { connection = null; channel = null; });
    channel.on('error', (err) => { console.error('RabbitMQ notif channel error', err); channel = null; });
    channel.on('close', () => { channel = null; });
    return channel;
  } catch (err) {
    console.error('Failed to connect RabbitMQ for notifications', err && err.message ? err.message : err);
    try { if (connection) await connection.close(); } catch (_) {}
    connection = null; channel = null;
    throw err;
  } finally {
    connecting = false;
  }
}

async function publishNotification(payload) {
  const ch = await connect();
  const buf = Buffer.from(JSON.stringify(payload));
  const ok = ch.publish(EXCHANGE, '', buf, { persistent: true });
  if (!ok) console.warn('notifications publish returned false');
}

module.exports = { publishNotification };
