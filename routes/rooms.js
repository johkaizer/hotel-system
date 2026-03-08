const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// List all rooms with optional filters
router.get('/', (req, res) => {
  const { status, type } = req.query;
  let query = 'SELECT * FROM rooms';
  const params = [];
  const conditions = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (type) { conditions.push('type = ?'); params.push(type); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY number';
  res.json(db.prepare(query).all(...params));
});

// Get room by id
router.get('/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
  res.json(room);
});

// Create room
router.post('/', (req, res) => {
  const { number, type, floor, price_per_night, capacity, description, amenities } = req.body;
  if (!number || !type || !floor || !price_per_night) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  const exists = db.prepare('SELECT id FROM rooms WHERE number = ?').get(number);
  if (exists) return res.status(409).json({ error: 'Número de quarto já existe' });
  const result = db.prepare(
    'INSERT INTO rooms (number, type, floor, price_per_night, capacity, description, amenities) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(number, type, floor, price_per_night, capacity || 2, description || '', amenities || '');
  res.status(201).json({ id: result.lastInsertRowid, message: 'Quarto criado com sucesso' });
});

// Update room
router.put('/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
  const { number, type, floor, price_per_night, status, capacity, description, amenities } = req.body;
  db.prepare(
    'UPDATE rooms SET number=?, type=?, floor=?, price_per_night=?, status=?, capacity=?, description=?, amenities=? WHERE id=?'
  ).run(
    number || room.number, type || room.type, floor || room.floor,
    price_per_night || room.price_per_night, status || room.status,
    capacity || room.capacity, description ?? room.description, amenities ?? room.amenities, req.params.id
  );
  res.json({ message: 'Quarto atualizado com sucesso' });
});

// Delete room
router.delete('/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Quarto não encontrado' });
  const active = db.prepare("SELECT id FROM reservations WHERE room_id = ? AND status IN ('confirmed','checked_in')").get(req.params.id);
  if (active) return res.status(409).json({ error: 'Quarto possui reservas ativas' });
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.json({ message: 'Quarto removido com sucesso' });
});

// Check availability
router.get('/check/availability', (req, res) => {
  const { check_in, check_out, type } = req.query;
  if (!check_in || !check_out) return res.status(400).json({ error: 'Datas são obrigatórias' });
  let query = `
    SELECT r.* FROM rooms r
    WHERE r.status != 'maintenance'
    AND r.id NOT IN (
      SELECT room_id FROM reservations
      WHERE status IN ('confirmed','checked_in')
      AND check_in_date < ? AND check_out_date > ?
    )
  `;
  const params = [check_out, check_in];
  if (type) { query += ' AND r.type = ?'; params.push(type); }
  res.json(db.prepare(query).all(...params));
});

module.exports = router;
