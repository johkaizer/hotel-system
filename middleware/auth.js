const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hotel_secret_key_2024';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};
