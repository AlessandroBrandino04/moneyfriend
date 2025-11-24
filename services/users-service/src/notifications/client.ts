let NOTIFICATIONS_URL = (process.env.NOTIFICATIONS_URL || 'http://notifications-service:6000/api/notifications') as string;

// Normalize and validate the URL early
try {
  NOTIFICATIONS_URL = NOTIFICATIONS_URL.trim();
  // remove control chars
  NOTIFICATIONS_URL = NOTIFICATIONS_URL.replace(/[\x00-\x1F\x7F]/g, '');
  // remove common zero-width / invisible characters that sometimes appear from copy/paste
  const invisibles = ['\uFEFF', '\u2060', '\u200B', '\u200C', '\u200D', '\u200E', '\u200F'];
  for (const ch of invisibles) {
    NOTIFICATIONS_URL = NOTIFICATIONS_URL.split(eval("'" + ch + "'")).join('');
  }
  // Will throw if invalid
  // eslint-disable-next-line no-unused-vars
  const _u = new URL(NOTIFICATIONS_URL);
} catch (err) {
  console.error('Invalid NOTIFICATIONS_URL:', NOTIFICATIONS_URL, err);
  // fallback to localhost (best-effort for local dev)
  NOTIFICATIONS_URL = 'http://localhost:6000/api/notifications';
}

import * as amqp from 'amqplib';

const RABBITMQ_URL = (process.env.RABBITMQ_URL || process.env.NOTIFICATIONS_BROKER_URL || 'amqp://guest:guest@rabbitmq:5672');
const EXCHANGE = process.env.NOTIFICATIONS_EXCHANGE || 'notifications';

let connection: any = null;
let channel: any = null;
let connecting = false;

async function connectWithRetry(): Promise<void> {
  if (connection && channel) return;
  if (connecting) return;
  connecting = true;
  let attempt = 0;
  let delay = 500;
  while (!connection || !channel) {
    attempt++;
    try {
      console.info(`Connecting to RabbitMQ (${RABBITMQ_URL}), attempt ${attempt}`);
      connection = await amqp.connect(RABBITMQ_URL);
      // create a confirm channel so publishes can be confirmed when needed
      channel = await connection.createConfirmChannel();
      await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });

      connection.on('error', (err: any) => {
        console.error('RabbitMQ connection error', err);
      });
      connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });

      channel.on('error', (err: any) => {
        console.error('RabbitMQ channel error', err);
        channel = null;
      });
      channel.on('close', () => {
        console.warn('RabbitMQ channel closed');
        channel = null;
      });

      console.info('Connected to RabbitMQ and exchange asserted');
      break;
    } catch (err: any) {
      console.error(`RabbitMQ connect attempt ${attempt} failed:`, err && err.message ? err.message : err);
      // cleanup
      try { if (connection) await connection.close(); } catch (_) {}
      connection = null;
      channel = null;
      // exponential backoff with cap
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(5000, delay * 2);
    }
  }
  connecting = false;
}

async function ensureChannel(): Promise<amqp.ConfirmChannel> {
  if (channel) return channel;
  await connectWithRetry();
  if (!channel) throw new Error('Unable to create RabbitMQ channel');
  return channel;
}

export async function publishNotification(payload: any): Promise<void> {
  try {
    const ch = await ensureChannel();
    const buf = Buffer.from(JSON.stringify(payload));
    // fire-and-forget using confirm channel; publish returns boolean but we can also wait for confirms if desired
    const published = ch.publish(EXCHANGE, '', buf, { persistent: true });
    if (!published) {
      console.warn('RabbitMQ publish returned false (write buffer full)');
    }
    // Optionally wait for confirmation (uncomment if you need strong delivery guarantees)
    // await ch.waitForConfirms();
  } catch (err) {
    console.error('Failed to publish notification to RabbitMQ', err);
    // ensure next attempt will try to reconnect
    try { if (channel) { await channel.close(); } } catch (_) {}
    channel = null;
    try { if (connection) { await connection.close(); } } catch (_) {}
    connection = null;
  }
}

export async function closeConnection(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
  } catch (err) {
    console.error('Error closing RabbitMQ connection', err);
  }
}

// Graceful shutdown when the Node process exits
process.on('exit', () => {
  if (connection) {
    try { connection.close(); } catch (_) {}
  }
});

process.on('SIGINT', async () => { await closeConnection(); process.exit(0); });
process.on('SIGTERM', async () => { await closeConnection(); process.exit(0); });

export default { publishNotification, closeConnection };
