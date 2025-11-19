// app.ts - Routing e Logica di Autenticazione Centrale

import express, { Request, Response, NextFunction } from 'express';

import * as httpProxy from 'http-proxy-middleware';

const createProxyMiddleware: any = (httpProxy as any).createProxyMiddleware || (httpProxy as any).default || (httpProxy as any);
import cors from 'cors';
import jwt from 'jsonwebtoken';


const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'il_tuo_segreto_jwt_fortissimo'; 

const USERS_API_URL = 'http://users-service:5000';
const PAYMENTS_API_URL = 'http://payments-service:5001'; // Assumiamo 5001

// Middleware
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DI AUTORIZZAZIONE CENTRALE ---
// Intercetta il JWT e lo valida PRIMA di instradare al microservizio
const authGatewayMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const publicRoutes = [
        '/api/users/register',
        '/api/users/login',
        '/api/users/health'
    ];

    // Se la rotta è pubblica, bypassa l'autenticazione
    if (publicRoutes.some(route => req.path.startsWith(route))) { // Uso startsWith per maggiore robustezza
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Uso la chiave segreta
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string, nickname: string };
        
        // LOGICA CRUCIALE: Rimuove il JWT e aggiunge l'ID utente verificato all'header
        req.headers['x-user-id'] = decoded.userId; 
        
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Applica il Middleware di Autorizzazione a TUTTE le rotte tranne quelle pubbliche
app.use('/api', authGatewayMiddleware); 

// --- CONFIGURAZIONE PROXY (ROUTING) ---

// 1. Servizio Utenti: /api/users/*
app.use('/api/users', createProxyMiddleware({
    target: USERS_API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/users': '/', // Rimuove '/api/users' prima di inviare al microservizio
    },
}));

// 2. Servizio Pagamenti: /api/payments/*
app.use('/api/payments', createProxyMiddleware({
    target: PAYMENTS_API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/payments': '/', // Rimuove '/api/payments' prima di inviare al microservizio
    },
}));


export default app;