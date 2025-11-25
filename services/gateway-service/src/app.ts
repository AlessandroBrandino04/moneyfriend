// app.ts - Routing e Logica di Autenticazione Centrale

import express, { Request, Response, NextFunction } from 'express';

import * as httpProxy from 'http-proxy-middleware';

const createProxyMiddleware: any = (httpProxy as any).createProxyMiddleware || (httpProxy as any).default || (httpProxy as any);
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { ClientRequest } from 'http';


const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'il_tuo_segreto_jwt_fortissimo'; 

const USERS_API_URL = 'http://users-service:5000';
const PAYMENTS_API_URL = 'http://payments-service:6100';
const NOTIFICATIONS_API_URL = 'http://notifications-service:6000';

// Middleware
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DI AUTORIZZAZIONE CENTRALE ---
// Intercetta il JWT e lo valida PRIMA di instradare al microservizio
const authGatewayMiddleware = (req: Request, res: Response, next: NextFunction) => {

    const publicRoutes = [
        '/users/register',
        '/users/login',
        '/users/health',
        '/payments/health'
    ];

    console.log('Auth Middleware WOOOOOOO - Incoming request to:', req.path);

    // Se la rotta è pubblica, bypassa l'autenticazione
    // Nota: a seconda del mount point (`app.use('/api', ...)`) `req.path` può essere
    // la parte dopo `/api` (es. `/users/register`) mentre `req.originalUrl` contiene
    // l'URL completo (es. `/api/users/register`). Per essere robusti, controlliamo
    // entrambe le forme.
    if (publicRoutes.some(route => req.path.startsWith(route) || req.originalUrl.startsWith(`/api${route}`))) {
        console.log('Auth Middleware - Public route, bypassing auth:', req.path, req.originalUrl);
        return next();
    }

    console.log('Auth Middleware - Checking Authorization header:', req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Uso la chiave segreta
        const decoded = jwt.verify(token, JWT_SECRET) as { sub: string, email: string, nickname: string };
        console.log('Decoded JWT in Gateway:', decoded);
        
        // LOGICA CRUCIALE: Rimuove il JWT e aggiunge l'ID utente verificato all'header
        req.headers['x-user-id'] = decoded.sub; 
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-nickname'] = decoded.nickname;
        
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
    // Riscriviamo sempre verso il percorso completo che il users-service espone,
    // in modo che il servizio veda `/api/users/register` (come è definito in users-service).
    pathRewrite: {
        '^/api/users': '/api/users',
        '^/users': '/api/users'
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
        // Copia gli header verificati (che sono stati aggiunti da authGatewayMiddleware)
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', String(req.headers['x-user-id']));
        }
        if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', String(req.headers['x-user-email']));
        }
        if (req.headers['x-user-nickname']) {
            proxyReq.setHeader('x-user-nickname', String(req.headers['x-user-nickname']));
        }

        // Se `express.json()` ha già parsato il body, dobbiamo riscriverlo nel proxy request
        // altrimenti il microservizio non riceve il payload (cause hang o body vuoto).
        try {
            if (req.body && Object.keys(req.body).length) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        } catch (e) {
            // Non fatale: log per debug
            console.debug('Error forwarding body to proxyReq:', e);
        }
    },
}));

// 2. Servizio Pagamenti: /api/payments/*
app.use('/api/payments', createProxyMiddleware({
    target: PAYMENTS_API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/payments': '/api/payments',
        '^/payments': '/api/payments'
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', String(req.headers['x-user-id']));
        }
        if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', String(req.headers['x-user-email']));
        }
        if (req.headers['x-user-nickname']) {
            proxyReq.setHeader('x-user-nickname', String(req.headers['x-user-nickname']));
        }
        try {
            if (req.body && Object.keys(req.body).length) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        } catch (e) {
            console.debug('Error forwarding body to payments proxyReq:', e);
        }
    },
}));

// 3. Servizio Notification: /api/notifications/*
app.use('/api/notifications', createProxyMiddleware({
    target: NOTIFICATIONS_API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/notifications': '/api/notifications',
        '^/notifications': '/api/notifications'
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', String(req.headers['x-user-id']));
        }
        if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', String(req.headers['x-user-email']));
        }
        if (req.headers['x-user-nickname']) {
            proxyReq.setHeader('x-user-nickname', String(req.headers['x-user-nickname']));
        }
        try {
            if (req.body && Object.keys(req.body).length) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        } catch (e) {
            console.debug('Error forwarding body to groups proxyReq:', e);
        }
    },
}));

// Proxy socket.io websocket requests to notifications service so the frontend
// can connect via the gateway (ensure ws:true to forward WebSocket upgrades)
app.use('/socket.io', createProxyMiddleware({
    target: NOTIFICATIONS_API_URL,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug'
}));


export default app;