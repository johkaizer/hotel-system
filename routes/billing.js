const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get full bill for a reservation
router.get('/:id', (req, res) => {
  const resv = db.prepare(`
    SELECT r.*, g.name as guest_name, g.cpf as guest_cpf, g.email as guest_email,
           rm.number as room_number, rm.type as room_type, rm.price_per_night
    FROM reservations r JOIN guests g ON r.guest_id = g.id JOIN rooms rm ON r.room_id = rm.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada' });

  const services = db.prepare(`
    SELECT rs.*, s.name as service_name, s.category
    FROM reservation_services rs JOIN services s ON rs.service_id = s.id
    WHERE rs.reservation_id = ?
  `).all(req.params.id);

  const payments = db.prepare('SELECT * FROM payments WHERE reservation_id = ? ORDER BY paid_at').all(req.params.id);
  const d1 = new Date(resv.check_in_date), d2 = new Date(resv.check_out_date);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  const room_total = resv.price_per_night * nights;
  const services_total = services.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = room_total + services_total;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = total - paid;

  res.json({ reservation: resv, nights, room_total, services, services_total, total, payments, paid, balance });
});

// Register payment
router.post('/:id/pay', (req, res) => {
  const { amount, method, notes } = req.body;
  if (!amount || !method) return res.status(400).json({ error: 'Valor e método de pagamento são obrigatórios' });
  const resv = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada' });
  const result = db.prepare('INSERT INTO payments (reservation_id, amount, method, notes) VALUES (?,?,?,?)').run(req.params.id, amount, method, notes || null);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Pagamento registrado com sucesso' });
});

module.exports = router;
