const { publishNotification } = require('./client');

function sendNotification(type, payload) {
  try {
    console.log('sendNotification called, type=', type, 'payload=', payload);
    publishNotification({ type, payload }).catch((e) => console.debug('notify failed', e));
  } catch (e) {
    console.debug('notify wrapper error', e);
  }
}

module.exports = { sendNotification };
