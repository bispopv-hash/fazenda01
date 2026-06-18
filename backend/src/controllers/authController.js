const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha obrigatórios' });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND active = TRUE',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Busca fazendas do usuário
    const farmsRes = await db.query(
      `SELECT f.id, f.name FROM farms f
       JOIN user_farms uf ON uf.farm_id = f.id
       WHERE uf.user_id = $1 AND f.active = TRUE`,
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      farms: farmsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const me = async (req, res) => {
  const farmsRes = await db.query(
    req.user.role === 'admin'
      ? 'SELECT id, name FROM farms WHERE active=TRUE'
      : `SELECT f.id, f.name FROM farms f
         JOIN user_farms uf ON uf.farm_id=f.id
         WHERE uf.user_id=$1 AND f.active=TRUE`,
    req.user.role === 'admin' ? [] : [req.user.id]
  );
  res.json({ user: req.user, farms: farmsRes.rows });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, farm_ids } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, email, password, role' });
    }
    const validRoles = ['admin','owner','manager','foreman','vet'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role inválido' });
    }

    const exists = await db.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id, name, email, role`,
      [name, email.toLowerCase().trim(), hash, role]
    );
    const newUser = result.rows[0];

    if (farm_ids && farm_ids.length) {
      for (const fid of farm_ids) {
        await db.query(
          'INSERT INTO user_farms (user_id, farm_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [newUser.id, fid]
        );
      }
    }

    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, me, register };
