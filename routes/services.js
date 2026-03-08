const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// List available services
router.get('/', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM services WHERE active = 1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY category, name';
  res.json(db.prepare(query).all(...params));
});

// Get services of a reservation
router.get('/reservation/:id', (req, res) => {
  const items = db.prepare(`
    SELECT rs.*, s.name as service_name, s.category
    FROM reservation_services rs JOIN services s ON rs.service_id = s.id
    WHERE rs.reservation_id = ? ORDER BY rs.charged_at DESC
  `).all(req.params.id);
  res.json(items);
});

// Charge a service to a reservation
router.post('/charge', (req, res) => {
  const { reservation_id, service_id, quantity, notes } = req.body;
  if (!reservation_id || !service_id) return res.status(400).json({ error: 'reservation_id e service_id são obrigatórios' });
  const resv = db.prepare("SELECT * FROM reservations WHERE id = ? AND status IN ('confirmed','checked_in')").get(reservation_id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada ou não está ativa' });
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(service_id);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
  const qty = quantity || 1;
  const result = db.prepare(
    'INSERT INTO reservation_services (reservation_id, service_id, quantity, unit_price, notes) VALUES (?,?,?,?,?)'
  ).run(reservation_id, service_id, qty, service.price, notes || null);
  res.status(201).json({ id: result.lastInsertRowid, total: qty * service.price, message: 'Serviço lançado com sucesso' });
});

// Remove a service charge
router.delete('/charge/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM reservation_services WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Lançamento não encontrado' });
  db.prepare('DELETE FROM reservation_services WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lançamento removido com sucesso' });
});

// CRUD for service catalog
router.post('/catalog', (req, res) => {
  const { name, category, price, description } = req.body;
  if (!name || !category || price === undefined) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  const result = db.prepare('INSERT INTO services (name, category, price, description) VALUES (?,?,?,?)').run(name, category, price, description || null);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Serviço criado' });
});

router.put('/catalog/:id', (req, res) => {
  const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!svc) return res.status(404).json({ error: 'Serviço não encontrado' });
  const { name, category, price, description, active } = req.body;
  db.prepare('UPDATE services SET name=?, category=?, price=?, description=?, active=? WHERE id=?').run(
    name || svc.name, category || svc.category, price ?? svc.price, description ?? svc.description, active ?? svc.active, req.params.id
  );
  res.json({ message: 'Serviço atualizado' });
});

module.exports = router;
