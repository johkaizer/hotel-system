const { db } = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  // Users
  const adminExists = db.prepare("SELECT id FROM users WHERE username = ?").get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)").run('admin', hash, 'Administrador', 'admin');
    db.prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)").run('recepcao', bcrypt.hashSync('recep123', 10), 'Recepcionista', 'staff');
    console.log('✅ Usuários criados');
  }

  // Rooms
  const roomCount = db.prepare('SELECT COUNT(*) as c FROM rooms').get();
  if (!roomCount || roomCount.c === 0) {
    const rooms = [
      { number: '101', type: 'Standard', floor: 1, price: 180, capacity: 2, amenities: 'TV, Ar-condicionado, Banheiro privativo' },
      { number: '102', type: 'Standard', floor: 1, price: 180, capacity: 2, amenities: 'TV, Ar-condicionado, Banheiro privativo' },
      { number: '103', type: 'Standard', floor: 1, price: 180, capacity: 2, amenities: 'TV, Ar-condicionado, Banheiro privativo' },
      { number: '104', type: 'Standard', floor: 1, price: 200, capacity: 3, amenities: 'TV, Ar-condicionado, Banheiro privativo, Sofá-cama' },
      { number: '201', type: 'Superior', floor: 2, price: 280, capacity: 2, amenities: 'TV 50", Ar-condicionado, Banheiro privativo, Varanda' },
      { number: '202', type: 'Superior', floor: 2, price: 280, capacity: 2, amenities: 'TV 50", Ar-condicionado, Banheiro privativo, Varanda' },
      { number: '203', type: 'Superior', floor: 2, price: 300, capacity: 3, amenities: 'TV 50", Ar-condicionado, Banheiro privativo, Varanda, Sofá-cama' },
      { number: '301', type: 'Deluxe', floor: 3, price: 420, capacity: 2, amenities: 'TV 65", Ar-condicionado, Banheiro hidromassagem, Varanda, Minibar' },
      { number: '302', type: 'Deluxe', floor: 3, price: 420, capacity: 2, amenities: 'TV 65", Ar-condicionado, Banheiro hidromassagem, Varanda, Minibar' },
      { number: '401', type: 'Suite', floor: 4, price: 680, capacity: 4, amenities: 'TV 75", Sala de estar, Cozinha, Varanda panorâmica, Minibar' },
      { number: '402', type: 'Suite', floor: 4, price: 850, capacity: 4, amenities: 'TV 75", Sala de estar, Cozinha, Varanda panorâmica, Minibar, Vista para o mar' },
    ];
    rooms.forEach(r => db.prepare('INSERT INTO rooms (number, type, floor, price_per_night, capacity, amenities) VALUES (?,?,?,?,?,?)').run(r.number, r.type, r.floor, r.price, r.capacity, r.amenities));
    db.prepare("UPDATE rooms SET status = 'occupied' WHERE number = '201'").run();
    db.prepare("UPDATE rooms SET status = 'cleaning' WHERE number = '102'").run();
    db.prepare("UPDATE rooms SET status = 'maintenance' WHERE number = '103'").run();
    console.log('✅ Quartos criados');
  }

  // Services catalog
  const svcCount = db.prepare('SELECT COUNT(*) as c FROM services').get();
  if (!svcCount || svcCount.c === 0) {
    const services = [
      { name: 'Café da Manhã', category: 'Alimentação', price: 45 },
      { name: 'Almoço no Quarto', category: 'Alimentação', price: 75 },
      { name: 'Jantar no Quarto', category: 'Alimentação', price: 90 },
      { name: 'Bebida Alcoólica (Minibar)', category: 'Alimentação', price: 25 },
      { name: 'Refrigerante (Minibar)', category: 'Alimentação', price: 12 },
      { name: 'Água Mineral', category: 'Alimentação', price: 8 },
      { name: 'Lavagem de Roupa', category: 'Lavanderia', price: 35 },
      { name: 'Passagem a Ferro', category: 'Lavanderia', price: 25 },
      { name: 'Lavagem Expressa', category: 'Lavanderia', price: 60 },
      { name: 'Massagem Relaxante 60min', category: 'SPA', price: 180 },
      { name: 'Massagem Pedras Quentes 90min', category: 'SPA', price: 250 },
      { name: 'Day Spa Completo', category: 'SPA', price: 450 },
      { name: 'Estacionamento Diário', category: 'Outros', price: 40 },
      { name: 'Transfer Aeroporto', category: 'Outros', price: 120 },
      { name: 'Babysitter (hora)', category: 'Outros', price: 55 },
    ];
    services.forEach(s => db.prepare('INSERT INTO services (name, category, price) VALUES (?,?,?)').run(s.name, s.category, s.price));
    console.log('✅ Serviços criados');
  }

  // Demo guests and reservations
  const guestCount = db.prepare('SELECT COUNT(*) as c FROM guests').get();
  if (!guestCount || guestCount.c === 0) {
    const guests = [
      { name: 'Carlos Eduardo Silva', cpf: '123.456.789-00', email: 'carlos@email.com', phone: '(11) 98765-4321', city: 'São Paulo', state: 'SP' },
      { name: 'Ana Paula Ferreira', cpf: '234.567.890-11', email: 'ana@email.com', phone: '(21) 97654-3210', city: 'Rio de Janeiro', state: 'RJ' },
      { name: 'Roberto Mendes Costa', cpf: '345.678.901-22', email: 'roberto@email.com', phone: '(31) 96543-2109', city: 'Belo Horizonte', state: 'MG' },
      { name: 'Maria Luíza Santos', cpf: '456.789.012-33', email: 'maria@email.com', phone: '(41) 95432-1098', city: 'Curitiba', state: 'PR' },
      { name: 'João Pedro Oliveira', cpf: '567.890.123-44', email: 'joao@email.com', phone: '(51) 94321-0987', city: 'Porto Alegre', state: 'RS' },
      { name: 'Fernanda Lima Rocha', cpf: '678.901.234-55', email: 'fernanda@email.com', phone: '(85) 93210-9876', city: 'Fortaleza', state: 'CE' },
    ];
    guests.forEach(g => db.prepare('INSERT INTO guests (name, cpf, email, phone, city, state) VALUES (?,?,?,?,?,?)').run(g.name, g.cpf, g.email, g.phone, g.city, g.state));

    const allRooms = db.prepare('SELECT id, number FROM rooms').all();
    const allGuests = db.prepare('SELECT id FROM guests').all();
    const findRoom = num => allRooms.find(r => r.number === num);
    const today = new Date().toISOString().split('T')[0];
    const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

    const reservations = [
      { g: allGuests[0].id, r: findRoom('201').id, ci: addDays(today, -2), co: addDays(today, 2), status: 'checked_in', amount: 280*4 },
      { g: allGuests[1].id, r: findRoom('401').id, ci: addDays(today, 1), co: addDays(today, 5), status: 'confirmed', amount: 680*4 },
      { g: allGuests[2].id, r: findRoom('301').id, ci: today, co: addDays(today, 3), status: 'confirmed', amount: 420*3 },
      { g: allGuests[3].id, r: findRoom('102').id, ci: addDays(today, -5), co: addDays(today, -2), status: 'checked_out', amount: 180*3 },
      { g: allGuests[4].id, r: findRoom('202').id, ci: addDays(today, 3), co: addDays(today, 7), status: 'confirmed', amount: 280*4 },
      { g: allGuests[5].id, r: findRoom('402').id, ci: addDays(today, -1), co: addDays(today, 4), status: 'confirmed', amount: 850*5 },
    ];
    reservations.forEach(rv => db.prepare('INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, status, total_amount) VALUES (?,?,?,?,?,?)').run(rv.g, rv.r, rv.ci, rv.co, rv.status, rv.amount));

    const firstResv = db.prepare("SELECT id FROM reservations WHERE status = 'checked_in'").get();
    if (firstResv) {
      const svcList = db.prepare('SELECT id, price FROM services').all().slice(0, 4);
      if (svcList[0]) db.prepare('INSERT INTO reservation_services (reservation_id, service_id, quantity, unit_price) VALUES (?,?,?,?)').run(firstResv.id, svcList[0].id, 2, svcList[0].price);
      if (svcList[3]) db.prepare('INSERT INTO reservation_services (reservation_id, service_id, quantity, unit_price) VALUES (?,?,?,?)').run(firstResv.id, svcList[3].id, 3, svcList[3].price);
    }

    const pastResv = db.prepare("SELECT id, total_amount FROM reservations WHERE status = 'checked_out'").get();
    if (pastResv) db.prepare('INSERT INTO payments (reservation_id, amount, method) VALUES (?,?,?)').run(pastResv.id, pastResv.total_amount, 'Cartão de Crédito');

    console.log('✅ Hóspedes e reservas de demonstração criados');
  }
}

module.exports = { seed };
