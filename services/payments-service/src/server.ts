import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const port = process.env.PORT || 4100;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Payments service listening on port ${port}`);
  // start subscriber to sync users/groups from event bus (best-effort)
  try {
    // require is used so TS can compile even if the file is JS
    const userSync = require('./subscribers/userSync.subscriber');
    if (userSync && typeof userSync.startUserSync === 'function') {
      userSync.startUserSync();
    }
  } catch (e) {
    console.warn('UserSync subscriber not started:', String(e));
  }
});
