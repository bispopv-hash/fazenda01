const db = require('../utils/db');

const listTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM management_types ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const list = async (req, res) => {
  try {
    const { animalId } = req.params;
    const result = await db.query(
      `SELECT m.*, mt.name AS type_name, mt.category, u.name AS responsible_name
       FROM managements m
       LEFT JOIN management_types mt ON mt.id=m.management_type_id
       LEFT JOIN users u ON u.id=m.responsible_id
       WHERE m.animal_id=$1 ORDER BY m.management_date DESC`,
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
    const {
      management_type_id, custom_type, management_date,
      product, dose, notes
    } = req.body;

    const animalRes = await db.query('SELECT farm_id FROM animals WHERE id=$1', [animalId]);
    if (!animalRes.rows.length) return res.status(404).json({ error: 'Animal não encontrado' });
    const farmId = animalRes.rows[0].farm_id;

    const result = await db.query(
      `INSERT INTO managements
         (animal_id, farm_id, management_type_id, custom_type,
          management_date, product, dose, responsible_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [animalId, farmId, management_type_id, custom_type,
       management_date || new Date().toISOString().split('T')[0],
       product, dose, req.user.id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manejo em lote
const batchCreate = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { animal_ids, management_type_id, custom_type, management_date, product, dose, notes } = req.body;
    if (!animal_ids?.length) return res.status(400).json({ error: 'animal_ids obrigatório' });

    const date = management_date || new Date().toISOString().split('T')[0];
    const inserted = [];
    for (const animalId of animal_ids) {
      const r = await db.query(
        `INSERT INTO managements
           (animal_id, farm_id, management_type_id, custom_type, management_date, product, dose, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [animalId, farmId, management_type_id, custom_type, date, product, dose, req.user.id, notes]
      );
      inserted.push(r.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createType = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'name obrigatório' });
    const result = await db.query(
      `INSERT INTO management_types (name, category) VALUES ($1, $2) RETURNING *`,
      [name, category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateType = async (req, res) => {
  try {
    const { name, category } = req.body;
    const result = await db.query(
      `UPDATE management_types SET name=$1, category=$2 WHERE id=$3 RETURNING *`,
      [name, category || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Tipo não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeType = async (req, res) => {
  try {
    const inUse = await db.query(
      'SELECT 1 FROM managements WHERE management_type_id=$1 LIMIT 1',
      [req.params.id]
    );
    if (inUse.rows.length) {
      return res.status(409).json({ error: 'Tipo em uso — não pode ser excluído' });
    }
    await db.query('DELETE FROM management_types WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { listTypes, createType, updateType, removeType, list, create, batchCreate };
