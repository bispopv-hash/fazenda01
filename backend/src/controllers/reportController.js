const db = require('../utils/db');

// Relatório de rebanho por raça
const byBreed = async (req, res) => {
  try {
    const { farmId } = req.params;
    const result = await db.query(
      `SELECT b.name AS breed, COUNT(a.id) AS count,
         COUNT(a.id) FILTER (WHERE a.sex='M') AS males,
         COUNT(a.id) FILTER (WHERE a.sex='F') AS females
       FROM animals a
       LEFT JOIN breeds b ON b.id=a.breed_id
       WHERE a.farm_id=$1 AND a.status='active'
       GROUP BY b.name ORDER BY count DESC`,
      [farmId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Relatório de pesagens (ganho médio por período)
const weightGain = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { start_date, end_date } = req.query;

    const result = await db.query(
      `SELECT a.tag, a.name, a.sex,
         MIN(w.weight_kg) AS min_weight,
         MAX(w.weight_kg) AS max_weight,
         MAX(w.weight_kg) - MIN(w.weight_kg) AS gain,
         COUNT(w.id) AS weighting_count
       FROM animals a
       JOIN weightings w ON w.animal_id=a.id
       WHERE a.farm_id=$1
         AND ($2::date IS NULL OR w.weighting_date >= $2::date)
         AND ($3::date IS NULL OR w.weighting_date <= $3::date)
       GROUP BY a.id, a.tag, a.name, a.sex
       HAVING COUNT(w.id) >= 2
       ORDER BY gain DESC`,
      [farmId, start_date || null, end_date || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Relatório de eventos (compras, vendas, mortes)
const events = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { start_date, end_date, event_type } = req.query;

    let query = `
      SELECT ae.*, a.tag, a.name AS animal_name, u.name AS responsible_name
      FROM animal_events ae
      JOIN animals a ON a.id=ae.animal_id
      LEFT JOIN users u ON u.id=ae.responsible_id
      WHERE ae.farm_id=$1`;
    const params = [farmId];
    let idx = 2;

    if (start_date) { query += ` AND ae.event_date >= $${idx++}`; params.push(start_date); }
    if (end_date) { query += ` AND ae.event_date <= $${idx++}`; params.push(end_date); }
    if (event_type) { query += ` AND ae.event_type = $${idx++}`; params.push(event_type); }
    query += ' ORDER BY ae.event_date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Relatório de manejos por período
const managements = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { start_date, end_date, category } = req.query;

    let query = `
      SELECT m.management_date, a.tag, a.name AS animal_name,
             mt.name AS type_name, mt.category, m.product, m.dose,
             u.name AS responsible_name
      FROM managements m
      JOIN animals a ON a.id=m.animal_id
      LEFT JOIN management_types mt ON mt.id=m.management_type_id
      LEFT JOIN users u ON u.id=m.responsible_id
      WHERE m.farm_id=$1`;
    const params = [farmId];
    let idx = 2;

    if (start_date) { query += ` AND m.management_date >= $${idx++}`; params.push(start_date); }
    if (end_date) { query += ` AND m.management_date <= $${idx++}`; params.push(end_date); }
    if (category) { query += ` AND mt.category = $${idx++}`; params.push(category); }
    query += ' ORDER BY m.management_date DESC, a.tag';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { byBreed, weightGain, events, managements };
