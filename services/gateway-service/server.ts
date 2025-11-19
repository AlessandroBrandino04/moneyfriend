// server.ts - Entry point del Gateway
import app from './src/app';
import dotenv from 'dotenv';
dotenv.config();



const port = process.env.PORT || 8000; // Il Gateway userà una porta esterna, es. 8000

const server = app.listen(port, () => {
  console.log(`[Gateway]: API Gateway listening on port ${port}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing Gateway server');
    server.close(() => {
        console.log('Gateway server closed.');
    });
});