const db = require('../utils/db');

const list = async (req, res) => {
  try {
    const { animalId } = req.params;
    const result = await db.query(
      `SELECT pm.*, pf.name AS from_pasture, pt.name AS to_pasture, u.name AS responsible_name
       FROM pasture_moves pm
       LEFT JOIN pastures pf ON pf.id=pm.from_pasture_id
       LEFT JOIN pastures pt ON pt.id=pm.to_pasture_id
       LEFT JOIN users u ON u.id=pm.responsible_id
       WHERE pm.animal_id=$1 ORDER BY pm.move_date DESC`,
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
    const { to_pasture_id, move_date, notes } = req.body;
    if (!to_pasture_id) return res.status(400).json({ error: 'Pasto destino obrigatório' });

    const animalRes = await db.query(
      'SELECT farm_id, current_pasture_id FROM animals WHERE id=$1', [animalId]
    );
    if (!animalRes.rows.length) return res.status(404).json({ error: 'Animal não encontrado' });
    const { farm_id, current_pasture_id } = animalRes.rows[0];

    // Registra a movimentação
    const result = await db.query(
      `INSERT INTO pasture_moves
         (animal_id, farm_id, from_pasture_id, to_pasture_id, move_date, responsible_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [animalId, farm_id, current_pasture_id, to_pasture_id,
       move_date || new Date().toISOString().split('T')[0],
       req.user.id, notes]
    );

    // Atualiza pasto atual do animal
    await db.query(
      'UPDATE animals SET current_pasture_id=$1 WHERE id=$2',
      [to_pasture_id, animalId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Troca em lote (vários animais para o mesmo pasto)
const batchMove = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { animal_ids, to_pasture_id, move_date, notes } = req.body;
    if (!animal_ids?.length || !to_pasture_id) {
      return res.status(400).json({ error: 'animal_ids e to_pasture_id obrigatórios' });
    }
    const date = move_date || new Date().toISOString().split('T')[0];
    const results = [];

    for (const animalId of animal_ids) {
      const animalRes = await db.query(
        'SELECT current_pasture_id FROM animals WHERE id=$1', [animalId]
      );
      const from = animalRes.rows[0]?.current_pasture_id;

      await db.query(
        `INSERT INTO pasture_moves
           (animal_id, farm_id, from_pasture_id, to_pasture_id, move_date, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [animalId, farmId, from, to_pasture_id, date, req.user.id, notes]
      );
      await db.query(
        'UPDATE animals SET current_pasture_id=$1 WHERE id=$2',
        [to_pasture_id, animalId]
      );
      results.push({ animal_id: animalId, moved: true });
    }
    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { list, create, batchMove };
