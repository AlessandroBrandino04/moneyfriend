import dotenv from 'dotenv';
dotenv.config();

import app from './src/app';

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Users service listening on port ${port}`);
});

// Gestione dell'arresto del server (buona pratica per Docker)
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed.');
    });
});