const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Check-in
router.post('/checkin/:id', (req, res) => {
  const resv = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada' });
  if (resv.status !== 'confirmed') return res.status(409).json({ error: `Reserva está com status "${resv.status}"` });
  db.prepare("UPDATE reservations SET status = 'checked_in' WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(resv.room_id);
  res.json({ message: 'Check-in realizado com sucesso' });
});

// Check-out
router.post('/checkout/:id', (req, res) => {
  const resv = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada' });
  if (resv.status !== 'checked_in') return res.status(409).json({ error: `Reserva está com status "${resv.status}"` });
  // Check unpaid balance
  const roomServices = db.prepare(`
    SELECT COALESCE(SUM(rs.quantity * rs.unit_price), 0) as services_total
    FROM reservation_services rs WHERE rs.reservation_id = ?
  `).get(req.params.id);
  const payments = db.prepare('SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE reservation_id = ?').get(req.params.id);
  const total = resv.total_amount + roomServices.services_total;
  const balance = total - payments.paid;
  db.prepare("UPDATE reservations SET status = 'checked_out' WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE rooms SET status = 'cleaning' WHERE id = ?").run(resv.room_id);
  res.json({ message: 'Check-out realizado com sucesso', total, paid: payments.paid, balance });
});

// Today's check-ins
router.get('/today/checkins', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const list = db.prepare(`
    SELECT r.*, g.name as guest_name, g.phone as guest_phone, rm.number as room_number, rm.type as room_type
    FROM reservations r JOIN guests g ON r.guest_id = g.id JOIN rooms rm ON r.room_id = rm.id
    WHERE r.check_in_date = ? AND r.status = 'confirmed'
  `).all(today);
  res.json(list);
});

// Today's check-outs
router.get('/today/checkouts', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const list = db.prepare(`
    SELECT r.*, g.name as guest_name, g.phone as guest_phone, rm.number as room_number, rm.type as room_type
    FROM reservations r JOIN guests g ON r.guest_id = g.id JOIN rooms rm ON r.room_id = rm.id
    WHERE r.check_out_date = ? AND r.status = 'checked_in'
  `).all(today);
  res.json(list);
});

module.exports = router;
