const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      'SELECT id, name, email, role, active FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows.length || !result.rows[0].active) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Verifica permissões por role
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado para este perfil' });
  }
  next();
};

// Verifica se usuário tem acesso à fazenda
const requireFarmAccess = async (req, res, next) => {
  try {
    const farmId = req.params.farmId || req.body.farm_id || req.query.farm_id;
    if (!farmId) return next();

    if (req.user.role === 'admin') return next();

    const result = await db.query(
      'SELECT 1 FROM user_farms WHERE user_id=$1 AND farm_id=$2',
      [req.user.id, farmId]
    );
    if (!result.rows.length) {
      return res.status(403).json({ error: 'Sem acesso a esta fazenda' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { auth, requireRole, requireFarmAccess };
