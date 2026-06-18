const db = require('../utils/db');

const list = async (req, res) => {
  try {
    const { animalId } = req.params;
    const result = await db.query(
      `SELECT w.*, u.name AS responsible_name
       FROM weightings w
       LEFT JOIN users u ON u.id=w.responsible_id
       WHERE w.animal_id=$1 ORDER BY w.weighting_date DESC`,
      [animalId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { weight_kg, weighting_date, notes } = req.body;
    if (!weight_kg) return res.status(400).json({ error: 'Peso obrigatório' });

    const animalRes = await db.query('SELECT farm_id FROM animals WHERE id=$1', [animalId]);
    if (!animalRes.rows.length) return res.status(404).json({ error: 'Animal não encontrado' });
    const farmId = animalRes.rows[0].farm_id;

    const result = await db.query(
      `INSERT INTO weightings (animal_id, farm_id, weight_kg, weighting_date, responsible_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [animalId, farmId, weight_kg,
       weighting_date || new Date().toISOString().split('T')[0],
       req.user.id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Pesagem em lote (vários animais de uma vez)
const batchCreate = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { items, weighting_date } = req.body;
    // items: [{animal_id, weight_kg, notes}]
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Items obrigatórios' });
    }
    const date = weighting_date || new Date().toISOString().split('T')[0];
    const inserted = [];

    for (const item of items) {
      const r = await db.query(
        `INSERT INTO weightings (animal_id, farm_id, weight_kg, weighting_date, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [item.animal_id, farmId, item.weight_kg, date, req.user.id, item.notes]
      );
      inserted.push(r.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM weightings WHERE id=$1', [id]);
    res.json({ message: 'Pesagem removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { list, create, batchCreate, remove };
