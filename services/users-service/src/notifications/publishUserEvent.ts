import * as amqp from 'amqplib';

const RABBITMQ_URL = (process.env.RABBITMQ_URL || process.env.NOTIFICATIONS_BROKER_URL || 'amqp://guest:guest@rabbitmq:5672');
const EXCHANGE = process.env.USERS_EXCHANGE || 'users';

// loosen RabbitMQ types to `any` to avoid TypeScript strict issues across services
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
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createConfirmChannel();
      await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
      connection.on('error', (err: any) => { console.error('RabbitMQ connection error (users publisher)', err); });
      connection.on('close', () => { connection = null; channel = null; });
      channel.on('error', (err: any) => { console.error('RabbitMQ channel error (users publisher)', err); channel = null; });
      channel.on('close', () => { channel = null; });
      break;
    } catch (err: any) {
      console.error('Failed to connect to RabbitMQ for users publisher', err && err.message ? err.message : err);
      try { if (connection) await connection.close(); } catch (_) {}
      connection = null; channel = null;
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(5000, delay * 2);
    }
  }
  connecting = false;
}

async function ensureChannel(): Promise<any> {
  if (channel) return channel;
  await connectWithRetry();
  if (!channel) throw new Error('Unable to create RabbitMQ channel for users publisher');
  return channel;
}

export async function publishUserEvent(type: string, data: any): Promise<void> {
  try {
    const ch = await ensureChannel();
    const payload = { type, data };
    const buf = Buffer.from(JSON.stringify(payload));
    const ok = ch.publish(EXCHANGE, '', buf, { persistent: true });
    if (!ok) console.warn('Users publisher: publish returned false');
  } catch (err) {
    console.error('Failed to publish user event', err);
    try { if (channel) await channel.close(); } catch (_) {}
    channel = null;
    try { if (connection) await connection.close(); } catch (_) {}
    connection = null;
  }
}

// keep a default export for compatibility, but export the function named as well
export default publishUserEvent;
