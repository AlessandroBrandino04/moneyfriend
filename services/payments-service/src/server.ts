import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const port = process.env.PORT || 4100;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Payments service listening on port ${port}`);
});
