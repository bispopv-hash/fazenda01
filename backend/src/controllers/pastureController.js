const db = require('../utils/db');

const list = async (req, res) => {
  try {
    const { farmId } = req.params;
    const result = await db.query(
      `SELECT p.*,
         COUNT(a.id) FILTER (WHERE a.status='active') AS animal_count
       FROM pastures p
       LEFT JOIN animals a ON a.current_pasture_id=p.id
       WHERE p.farm_id=$1 AND p.active=TRUE
       GROUP BY p.id ORDER BY p.name`,
      [farmId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const get = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT p.*,
         COUNT(a.id) FILTER (WHERE a.status='active') AS animal_count
       FROM pastures p
       LEFT JOIN animals a ON a.current_pasture_id=p.id
       WHERE p.id=$1 AND p.active=TRUE GROUP BY p.id`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pasto não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { name, area_ha, grass_type, capacity } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

    const result = await db.query(
      `INSERT INTO pastures (farm_id, name, area_ha, grass_type, capacity)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [farmId, name, area_ha, grass_type, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, area_ha, grass_type, capacity } = req.body;
    const result = await db.query(
      `UPDATE pastures SET name=$1, area_ha=$2, grass_type=$3, capacity=$4
       WHERE id=$5 AND active=TRUE RETURNING *`,
      [name, area_ha, grass_type, capacity, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pasto não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE pastures SET active=FALSE WHERE id=$1', [id]);
    res.json({ message: 'Pasto desativado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lista animais de um pasto
const animals = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT a.id, a.tag, a.name, a.sex, b.name AS breed, a.status
       FROM animals a
       LEFT JOIN breeds b ON b.id=a.breed_id
       WHERE a.current_pasture_id=$1 AND a.status='active'
       ORDER BY a.tag`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { list, get, create, update, remove, animals };
