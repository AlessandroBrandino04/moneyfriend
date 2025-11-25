import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// mount debts routes for owed balances and group debts
const debtsRoutes = require('./routes/debts.routes');
app.use('/api/payments/debts', debtsRoutes);
// compatibility alias: expose debts endpoints also directly under /api/payments
app.use('/api/payments', debtsRoutes);

// mount payments routes
const paymentsRoutes = require('./routes/payments.routes');
app.use('/api/payments', paymentsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/payments/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
