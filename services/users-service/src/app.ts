// ./services/users-service/src/app.ts (Questo gestisce la configurazione Express)
import express, { Request, Response } from 'express';
import cors from 'cors'; // Importiamo cors (lo hai nelle dependencies)
import { PrismaClient } from '@prisma/client';
import authRoutes from './routers/AuthRouters';

// Inizializza il client Prisma (puoi farlo qui o in un servizio DB separato)
const prisma = new PrismaClient();
const app = express();


// --- MIDDLEWARE ---
app.use(express.json()); // Permette ad Express di leggere il body delle richieste JSON
app.use(cors());         // Permette richieste da origini diverse (necessario per il frontend React)

// --- ROTTE ---

// Rotta di Test (Health Check)
app.get('/api/users/health', (req: Request, res: Response) => {
  res.status(200).send({ message: 'Users Service is running successfully!' });
});

// Caricamento delle Rotte di Autenticazione: /api/users/ + authRoutes
app.use('/api/users', authRoutes);

prisma.$connect()
    .then(() => console.log('Prisma connected to the DB successfully from App config.'))
    .catch((e: unknown) => console.error('Prisma connection error during App setup:', e));
export default app;
