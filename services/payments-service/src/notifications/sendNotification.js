const { publishNotification } = require('./client');

function sendNotification(type, payload) {
  try {
    publishNotification({ type, payload }).catch((e) => console.debug('notify failed', e));
  } catch (e) {
    console.debug('notify wrapper error', e);
  }
}

module.exports = { sendNotification };
