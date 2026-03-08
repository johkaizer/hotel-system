const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function startServer() {
  // Initialize database (async WASM loading)
  await initDb();
  console.log('✅ Banco de dados inicializado');

  // Seed demo data
  const { seed } = require('./database/seed');
  seed();

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

  app.listen(PORT, () => {
    console.log(`\n🏨 Hotel Management System`);
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Login: admin / admin123\n`);
  });
}

startServer().catch(err => { console.error('Erro ao iniciar servidor:', err); process.exit(1); });
