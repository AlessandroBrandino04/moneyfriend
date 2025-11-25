require('dotenv').config();
const axios = require('axios');
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const readline = require('readline');

const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_URL || 'http://localhost:6000';
const SOCKET_URL = process.env.SOCKET_URL || NOTIFICATIONS_URL;
const TEST_USER_ID = process.env.TEST_USER_ID || '1';
const JWT_SECRET = process.env.JWT_SECRET;
const TEST_JWT = process.env.TEST_JWT;

function makeToken() {
  if (TEST_JWT && TEST_JWT.length > 0) return TEST_JWT;
  if (!JWT_SECRET) {
    console.error('No TEST_JWT or JWT_SECRET provided. Set one in .env or via env vars.');
    process.exit(1);
  }
  const token = jwt.sign({ sub: String(TEST_USER_ID) }, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

const token = makeToken();

console.log('Using token for userId=', TEST_USER_ID);
// Allow forcing websocket-only transport via env (useful for debugging polling failures)
const socketOptions = { auth: { token } };
if (process.env.FORCE_WS === 'true') {
  socketOptions.transports = ['websocket'];
  console.log('Forcing WebSocket-only transport (FORCE_WS=true)');
}
const socket = io(SOCKET_URL, socketOptions);

socket.on('connect', () => console.log('Socket connected id=', socket.id));
socket.on('connect_error', (err) => console.error('Socket connect_error', err && err.message ? err.message : err));
socket.on('disconnect', (reason) => console.log('Socket disconnected', reason));

socket.on('notifications.initial', (list) => {
  console.log('Initial unread notifications:', JSON.stringify(list, null, 2));
});

socket.on('notification', (n) => {
  console.log('Incoming notification:', JSON.stringify(n, null, 2));
});

async function httpGetNotifications(unreadOnly = false) {
  try {
    const res = await axios.get(`${NOTIFICATIONS_URL}/api/notifications${unreadOnly ? '?unread=true' : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('GET /api/notifications =>', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('GET notifications failed', e && e.response ? e.response.data : e.message);
  }
}

async function httpPublish(type, message) {
  try {
    const payload = { type, userId: String(TEST_USER_ID), payload: { message } };
    const res = await axios.post(`${NOTIFICATIONS_URL}/api/notifications`, payload);
    console.log('POST /api/notifications =>', res.data);
  } catch (e) {
    console.error('Publish failed', e && e.response ? e.response.data : e.message);
  }
}

async function httpMarkRead(id) {
  try {
    const res = await axios.post(`${NOTIFICATIONS_URL}/api/notifications/mark-read`, { id }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Mark-read =>', res.data);
  } catch (e) {
    console.error('Mark read failed', e && e.response ? e.response.data : e.message);
  }
}

console.log('Commands:');
console.log('  pub <type> <message>    - publish a notification to your TEST_USER_ID');
console.log('  list                    - list notifications (all)');
console.log('  listunread              - list only unread notifications');
console.log('  mark <id>               - mark notification id as read');
console.log('  exit                    - quit');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', async (line) => {
  const parts = line.trim().split(' ');
  const cmd = parts[0];
  if (!cmd) return;
  if (cmd === 'pub') {
    const type = parts[1] || 'info';
    const message = parts.slice(2).join(' ') || 'hello from test-client';
    await httpPublish(type, message);
  } else if (cmd === 'list') {
    await httpGetNotifications(false);
  } else if (cmd === 'listunread') {
    await httpGetNotifications(true);
  } else if (cmd === 'mark') {
    const id = parts[1];
    if (!id) return console.log('mark requires id');
    await httpMarkRead(id);
  } else if (cmd === 'exit') {
    rl.close();
    socket.close();
    process.exit(0);
  } else {
    console.log('Unknown command', cmd);
  }
});
