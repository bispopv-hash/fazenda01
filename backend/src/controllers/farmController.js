const db = require('../utils/db');

const list = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.query(
        `SELECT f.*, COUNT(DISTINCT a.id) FILTER (WHERE a.status='active') AS animal_count
         FROM farms f LEFT JOIN animals a ON a.farm_id=f.id
         WHERE f.active=TRUE GROUP BY f.id ORDER BY f.name`
      );
    } else {
      result = await db.query(
        `SELECT f.*, COUNT(DISTINCT a.id) FILTER (WHERE a.status='active') AS animal_count
         FROM farms f
         JOIN user_farms uf ON uf.farm_id=f.id
         LEFT JOIN animals a ON a.farm_id=f.id
         WHERE uf.user_id=$1 AND f.active=TRUE
         GROUP BY f.id ORDER BY f.name`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const get = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM farms WHERE id=$1 AND active=TRUE', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Fazenda não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, owner_name, state, city, address, total_area_ha } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

    const result = await db.query(
      `INSERT INTO farms (name, owner_name, state, city, address, total_area_ha)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, owner_name, state, city, address, total_area_ha]
    );
    const farm = result.rows[0];

    // Vincula o criador à fazenda
    await db.query(
      'INSERT INTO user_farms (user_id, farm_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, farm.id]
    );

    res.status(201).json(farm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner_name, state, city, address, total_area_ha } = req.body;

    const result = await db.query(
      `UPDATE farms SET name=$1, owner_name=$2, state=$3, city=$4,
       address=$5, total_area_ha=$6 WHERE id=$7 AND active=TRUE RETURNING *`,
      [name, owner_name, state, city, address, total_area_ha, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Fazenda não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE farms SET active=FALSE WHERE id=$1', [id]);
    res.json({ message: 'Fazenda desativada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const dashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const [animals, pastures, weights, events] = await Promise.all([
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status='active') AS active,
           COUNT(*) FILTER (WHERE status='sold') AS sold,
           COUNT(*) FILTER (WHERE status='dead') AS dead,
           COUNT(*) FILTER (WHERE sex='M' AND status='active') AS males,
           COUNT(*) FILTER (WHERE sex='F' AND status='active') AS females
         FROM animals WHERE farm_id=$1`, [id]
      ),
      db.query(
        `SELECT COUNT(*) AS total,
           SUM(capacity) AS total_capacity
         FROM pastures WHERE farm_id=$1 AND active=TRUE`, [id]
      ),
      db.query(
        `SELECT AVG(w.weight_kg) AS avg_weight
         FROM weightings w
         JOIN (
           SELECT animal_id, MAX(weighting_date) AS last_date
           FROM weightings WHERE farm_id=$1
           GROUP BY animal_id
         ) latest ON w.animal_id=latest.animal_id AND w.weighting_date=latest.last_date`,
        [id]
      ),
      db.query(
        `SELECT event_type, COUNT(*) AS count
         FROM animal_events
         WHERE farm_id=$1 AND event_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY event_type`, [id]
      ),
    ]);

    res.json({
      animals: animals.rows[0],
      pastures: pastures.rows[0],
      avg_weight: weights.rows[0]?.avg_weight,
      recent_events: events.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { list, get, create, update, remove, dashboard };
