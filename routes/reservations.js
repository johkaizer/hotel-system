const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

function calcTotal(roomId, checkIn, checkOut) {
  const room = db.prepare('SELECT price_per_night FROM rooms WHERE id = ?').get(roomId);
  if (!room) return 0;
  const d1 = new Date(checkIn), d2 = new Date(checkOut);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  return room.price_per_night * nights;
}

// List all reservations
router.get('/', (req, res) => {
  const { status, date } = req.query;
  let query = `
    SELECT r.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email,
           rm.number as room_number, rm.type as room_type, rm.price_per_night
    FROM reservations r
    JOIN guests g ON r.guest_id = g.id
    JOIN rooms rm ON r.room_id = rm.id
  `;
  const conditions = [];
  const params = [];
  if (status) { conditions.push('r.status = ?'); params.push(status); }
  if (date) { conditions.push('(r.check_in_date <= ? AND r.check_out_date > ?)'); params.push(date, date); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY r.check_in_date DESC';
  res.json(db.prepare(query).all(...params));
});

// Get single reservation
router.get('/:id', (req, res) => {
  const res_ = db.prepare(`
    SELECT r.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email, g.cpf as guest_cpf,
           rm.number as room_number, rm.type as room_type, rm.price_per_night, rm.amenities
    FROM reservations r
    JOIN guests g ON r.guest_id = g.id
    JOIN rooms rm ON r.room_id = rm.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!res_) return res.status(404).json({ error: 'Reserva não encontrada' });
  res.json(res_);
});

// Create reservation
router.post('/', (req, res) => {
  const { guest_id, room_id, check_in_date, check_out_date, adults, children, notes } = req.body;
  if (!guest_id || !room_id || !check_in_date || !check_out_date)
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  if (new Date(check_out_date) <= new Date(check_in_date))
    return res.status(400).json({ error: 'Data de check-out deve ser posterior ao check-in' });
  // Check availability
  const conflict = db.prepare(`
    SELECT id FROM reservations
    WHERE room_id = ? AND status IN ('confirmed','checked_in')
    AND check_in_date < ? AND check_out_date > ?
  `).get(room_id, check_out_date, check_in_date);
  if (conflict) return res.status(409).json({ error: 'Quarto não disponível para o período selecionado' });
  const total = calcTotal(room_id, check_in_date, check_out_date);
  const result = db.prepare(
    'INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, adults, children, total_amount, notes) VALUES (?,?,?,?,?,?,?,?)'
  ).run(guest_id, room_id, check_in_date, check_out_date, adults || 1, children || 0, total, notes || null);
  res.status(201).json({ id: result.lastInsertRowid, total_amount: total, message: 'Reserva criada com sucesso' });
});

// Update reservation
router.put('/:id', (req, res) => {
  const resv = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada' });
  const { check_in_date, check_out_date, adults, children, notes, status } = req.body;
  const newIn = check_in_date || resv.check_in_date;
  const newOut = check_out_date || resv.check_out_date;
  const total = calcTotal(resv.room_id, newIn, newOut);
  db.prepare(
    'UPDATE reservations SET check_in_date=?, check_out_date=?, adults=?, children=?, notes=?, status=?, total_amount=? WHERE id=?'
  ).run(newIn, newOut, adults ?? resv.adults, children ?? resv.children, notes ?? resv.notes, status || resv.status, total, req.params.id);
  res.json({ message: 'Reserva atualizada com sucesso', total_amount: total });
});

// Cancel reservation
router.delete('/:id', (req, res) => {
  const resv = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!resv) return res.status(404).json({ error: 'Reserva não encontrada' });
  if (resv.status === 'checked_in') return res.status(409).json({ error: 'Não é possível cancelar uma reserva com check-in realizado' });
  db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE rooms SET status = 'available' WHERE id = ?").run(resv.room_id);
  res.json({ message: 'Reserva cancelada com sucesso' });
});

module.exports = router;
