const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./database/db');
const { seed } = require('./database/seed');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const authRouter = require('./routes/auth');
const roomsRouter = require('./routes/rooms');
const guestsRouter = require('./routes/guests');
const reservationsRouter = require('./routes/reservations');
const checkinRouter = require('./routes/checkin');
const servicesRouter = require('./routes/services');
const billingRouter = require('./routes/billing');
const reportsRouter = require('./routes/reports');

const app = express();

app.use(cors());
app.use(express.json());
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

let dbInitialized = false;

// Middleware to ensure DB is initialized before handling API requests
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      seed();
      dbInitialized = true;
      console.log('✅ Banco de dados inicializado em memória para Serverless');
    } catch (err) {
      console.error('Erro ao inicializar DB:', err);
      return res.status(500).json({ error: 'Database initialization failed', details: err.message, stack: err.stack });
    }
  }
  next();
});

// Public route
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/rooms', authMiddleware, roomsRouter);
app.use('/api/guests', authMiddleware, guestsRouter);
app.use('/api/reservations', authMiddleware, reservationsRouter);
app.use('/api/checkin', authMiddleware, checkinRouter);
app.use('/api/checkout', authMiddleware, checkinRouter);
app.use('/api/services', authMiddleware, servicesRouter);
app.use('/api/billing', authMiddleware, billingRouter);
app.use('/api/reports', authMiddleware, reportsRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

// Only listen if not running in Vercel (where module.parent exists or process.env.VERCEL is set)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🏨 Hotel Management System`);
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Login: admin / admin123\n`);
  });
}

// Export for Vercel serverless
module.exports = app;
