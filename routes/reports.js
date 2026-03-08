const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Dashboard KPIs
router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const occupied = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'occupied'").get();
  const total_rooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
  const checkins_today = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE check_in_date = ? AND status = 'confirmed'").get(today);
  const checkouts_today = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE check_out_date = ? AND status = 'checked_in'").get(today);
  const guests_in_house = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'checked_in'").get();
  const revenue_month = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments
    WHERE strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')
  `).get();
  const recent_reservations = db.prepare(`
    SELECT r.*, g.name as guest_name, rm.number as room_number
    FROM reservations r JOIN guests g ON r.guest_id = g.id JOIN rooms rm ON r.room_id = rm.id
    ORDER BY r.created_at DESC LIMIT 5
  `).all();
  res.json({
    occupied: occupied.count,
    total_rooms: total_rooms.count,
    checkins_today: checkins_today.count,
    checkouts_today: checkouts_today.count,
    guests_in_house: guests_in_house.count,
    revenue_month: revenue_month.total,
    recent_reservations
  });
});

// Occupancy report
router.get('/occupancy', (req, res) => {
  const { start, end } = req.query;
  const s = start || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const e = end || new Date().toISOString().split('T')[0];
  const data = db.prepare(`
    WITH RECURSIVE dates(date) AS (
      SELECT ? UNION ALL SELECT date(date, '+1 day') FROM dates WHERE date < ?
    )
    SELECT d.date,
      (SELECT COUNT(*) FROM reservations r WHERE r.check_in_date <= d.date AND r.check_out_date > d.date AND r.status IN ('confirmed','checked_in','checked_out')) as occupied,
      (SELECT COUNT(*) FROM rooms) as total
    FROM dates d ORDER BY d.date
  `).all(s, e);
  res.json(data);
});

// Revenue report
router.get('/revenue', (req, res) => {
  const { start, end } = req.query;
  const s = start || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const e = end || new Date().toISOString().split('T')[0];
  const data = db.prepare(`
    SELECT strftime('%Y-%m-%d', paid_at) as date, SUM(amount) as revenue, COUNT(*) as transactions
    FROM payments WHERE date(paid_at) BETWEEN ? AND ?
    GROUP BY strftime('%Y-%m-%d', paid_at) ORDER BY date
  `).all(s, e);
  res.json(data);
});

// Top guests
router.get('/top-guests', (req, res) => {
  const data = db.prepare(`
    SELECT g.id, g.name, g.email, COUNT(r.id) as total_stays,
           COALESCE(SUM(p.amount),0) as total_spent
    FROM guests g
    LEFT JOIN reservations r ON r.guest_id = g.id AND r.status != 'cancelled'
    LEFT JOIN payments p ON p.reservation_id = r.id
    GROUP BY g.id ORDER BY total_stays DESC, total_spent DESC LIMIT 10
  `).all();
  res.json(data);
});

// Room type breakdown
router.get('/room-types', (req, res) => {
  const data = db.prepare(`
    SELECT rm.type, COUNT(r.id) as reservations,
           COALESCE(SUM(p.amount), 0) as revenue
    FROM rooms rm
    LEFT JOIN reservations r ON r.room_id = rm.id AND r.status != 'cancelled'
    LEFT JOIN payments p ON p.reservation_id = r.id
    GROUP BY rm.type ORDER BY revenue DESC
  `).all();
  res.json(data);
});

module.exports = router;
