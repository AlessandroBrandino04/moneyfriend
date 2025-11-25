require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 6100;

app.use(express.json());

// mount debts routes for owed balances and group debts
const debtsRoutes = require('./routes/debts.routes');
app.use('/api/payments/debts', debtsRoutes);
// compatibility alias: expose debts endpoints also directly under /api/payments
app.use('/api/payments', debtsRoutes);

// mount payments routes
//const paymentsRoutes = require('./routes/payments.routes');
//app.use('/api/payments', paymentsRoutes);



app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log('Payments service listening on', PORT));

module.exports = app;
