const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// List guests with search
router.get('/', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM guests';
  const params = [];
  if (search) {
    query += ' WHERE name LIKE ? OR cpf LIKE ? OR email LIKE ? OR phone LIKE ?';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  query += ' ORDER BY name';
  res.json(db.prepare(query).all(...params));
});

// Get guest by id with reservation history
router.get('/:id', (req, res) => {
  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!guest) return res.status(404).json({ error: 'Hóspede não encontrado' });
  const reservations = db.prepare(`
    SELECT r.*, rm.number as room_number, rm.type as room_type
    FROM reservations r JOIN rooms rm ON r.room_id = rm.id
    WHERE r.guest_id = ? ORDER BY r.check_in_date DESC
  `).all(req.params.id);
  res.json({ ...guest, reservations });
});

// Create guest
router.post('/', (req, res) => {
  const { name, cpf, email, phone, address, city, state, nationality, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  if (cpf) {
    const exists = db.prepare('SELECT id FROM guests WHERE cpf = ?').get(cpf);
    if (exists) return res.status(409).json({ error: 'CPF já cadastrado' });
  }
  const result = db.prepare(
    'INSERT INTO guests (name, cpf, email, phone, address, city, state, nationality, notes) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(name, cpf || null, email || null, phone || null, address || null, city || null, state || null, nationality || 'Brasileiro', notes || null);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Hóspede cadastrado com sucesso' });
});

// Update guest
router.put('/:id', (req, res) => {
  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!guest) return res.status(404).json({ error: 'Hóspede não encontrado' });
  const { name, cpf, email, phone, address, city, state, nationality, notes } = req.body;
  db.prepare(
    'UPDATE guests SET name=?, cpf=?, email=?, phone=?, address=?, city=?, state=?, nationality=?, notes=? WHERE id=?'
  ).run(
    name || guest.name, cpf ?? guest.cpf, email ?? guest.email, phone ?? guest.phone,
    address ?? guest.address, city ?? guest.city, state ?? guest.state,
    nationality || guest.nationality, notes ?? guest.notes, req.params.id
  );
  res.json({ message: 'Hóspede atualizado com sucesso' });
});

// Delete guest
router.delete('/:id', (req, res) => {
  const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!guest) return res.status(404).json({ error: 'Hóspede não encontrado' });
  db.prepare('DELETE FROM guests WHERE id = ?').run(req.params.id);
  res.json({ message: 'Hóspede removido com sucesso' });
});

module.exports = router;
