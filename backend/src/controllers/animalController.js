const db = require('../utils/db');

const list = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { status = 'active', pasture_id, sex, search } = req.query;

    let query = `
      SELECT a.id, a.tag, a.name, a.sex, a.birth_date, a.status, a.entry_type,
             b.name AS breed, p.name AS pasture,
             (SELECT weight_kg FROM weightings w WHERE w.animal_id=a.id
              ORDER BY weighting_date DESC LIMIT 1) AS last_weight
      FROM animals a
      LEFT JOIN breeds b ON b.id=a.breed_id
      LEFT JOIN pastures p ON p.id=a.current_pasture_id
      WHERE a.farm_id=$1`;
    const params = [farmId];
    let idx = 2;

    if (status) { query += ` AND a.status=$${idx++}`; params.push(status); }
    if (pasture_id) { query += ` AND a.current_pasture_id=$${idx++}`; params.push(pasture_id); }
    if (sex) { query += ` AND a.sex=$${idx++}`; params.push(sex); }
    if (search) {
      query += ` AND (a.tag ILIKE $${idx} OR a.name ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }
    query += ' ORDER BY a.tag';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const get = async (req, res) => {
  try {
    const { id } = req.params;
    const animalRes = await db.query(
      `SELECT a.*, b.name AS breed_name,
              p.name AS pasture_name,
              m.tag AS mother_tag, m.name AS mother_name,
              f.tag AS father_tag, f.name AS father_name
       FROM animals a
       LEFT JOIN breeds b ON b.id=a.breed_id
       LEFT JOIN pastures p ON p.id=a.current_pasture_id
       LEFT JOIN animals m ON m.id=a.mother_id
       LEFT JOIN animals f ON f.id=a.father_id
       WHERE a.id=$1`, [id]
    );
    if (!animalRes.rows.length) return res.status(404).json({ error: 'Animal não encontrado' });

    const [weights, managements, moves, events] = await Promise.all([
      db.query(`SELECT w.*, u.name AS responsible_name FROM weightings w
                LEFT JOIN users u ON u.id=w.responsible_id
                WHERE w.animal_id=$1 ORDER BY w.weighting_date DESC`, [id]),
      db.query(`SELECT m.*, mt.name AS type_name, mt.category, u.name AS responsible_name
                FROM managements m
                LEFT JOIN management_types mt ON mt.id=m.management_type_id
                LEFT JOIN users u ON u.id=m.responsible_id
                WHERE m.animal_id=$1 ORDER BY m.management_date DESC`, [id]),
      db.query(`SELECT pm.*, pf.name AS from_pasture, pt.name AS to_pasture, u.name AS responsible_name
                FROM pasture_moves pm
                LEFT JOIN pastures pf ON pf.id=pm.from_pasture_id
                LEFT JOIN pastures pt ON pt.id=pm.to_pasture_id
                LEFT JOIN users u ON u.id=pm.responsible_id
                WHERE pm.animal_id=$1 ORDER BY pm.move_date DESC`, [id]),
      db.query(`SELECT ae.*, u.name AS responsible_name
                FROM animal_events ae
                LEFT JOIN users u ON u.id=ae.responsible_id
                WHERE ae.animal_id=$1 ORDER BY ae.event_date DESC`, [id]),
    ]);

    res.json({
      ...animalRes.rows[0],
      weights: weights.rows,
      managements: managements.rows,
      pasture_moves: moves.rows,
      events: events.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { farmId } = req.params;
    const {
      tag, name, sex, breed_id, birth_date, birth_type,
      mother_id, father_id, current_pasture_id, entry_type, entry_date,
      notes, initial_weight,
      // Campos de evento de entrada
      purchase_price, seller_name,
    } = req.body;

    if (!tag || !sex) return res.status(400).json({ error: 'tag e sex obrigatórios' });

    // Converte strings vazias para null em campos UUID
    const toUuid = v => (v && v.trim() !== '' ? v : null);

    const result = await db.query(
      `INSERT INTO animals
         (farm_id,tag,name,sex,breed_id,birth_date,birth_type,
          mother_id,father_id,current_pasture_id,entry_type,entry_date,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [farmId, tag, name || null, sex, toUuid(breed_id), birth_date || null, birth_type || 'natural',
       toUuid(mother_id), toUuid(father_id), toUuid(current_pasture_id),
       entry_type || 'birth', entry_date || new Date().toISOString().split('T')[0], notes || null]
    );
    const animal = result.rows[0];

    // Registra peso inicial se informado
    if (initial_weight) {
      await db.query(
        `INSERT INTO weightings (animal_id, farm_id, weight_kg, weighting_date, responsible_id)
         VALUES ($1,$2,$3,$4,$5)`,
        [animal.id, farmId, initial_weight, entry_date || new Date().toISOString().split('T')[0], req.user.id]
      );
    }

    // Registra evento de entrada
    const evtType = entry_type === 'purchase' ? 'purchase' : 'birth';
    await db.query(
      `INSERT INTO animal_events (animal_id, farm_id, event_type, event_date, counterpart, price, responsible_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [animal.id, farmId, evtType,
       entry_date || new Date().toISOString().split('T')[0],
       seller_name || null, purchase_price || null, req.user.id]
    );

    res.status(201).json(animal);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Tag já cadastrada nesta fazenda' });
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tag, name, sex, breed_id, birth_date, birth_type,
      mother_id, father_id, current_pasture_id, notes
    } = req.body;

    const toUuid = v => (v && v.trim() !== '' ? v : null);
    const result = await db.query(
      `UPDATE animals SET tag=$1,name=$2,sex=$3,breed_id=$4,birth_date=$5,
       birth_type=$6,mother_id=$7,father_id=$8,current_pasture_id=$9,notes=$10
       WHERE id=$11 RETURNING *`,
      [tag, name||null, sex, toUuid(breed_id), birth_date||null, birth_type,
       toUuid(mother_id), toUuid(father_id), toUuid(current_pasture_id), notes||null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Animal não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Registra evento: venda, morte, transferência
const registerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_type, event_date, counterpart, price,
      cause_of_death, destination_farm, notes
    } = req.body;

    const animalRes = await db.query('SELECT farm_id FROM animals WHERE id=$1', [id]);
    if (!animalRes.rows.length) return res.status(404).json({ error: 'Animal não encontrado' });
    const farmId = animalRes.rows[0].farm_id;

    // Atualiza status do animal
    const statusMap = { sale: 'sold', death: 'dead', transfer: 'transferred' };
    const newStatus = statusMap[event_type];
    if (newStatus) {
      await db.query('UPDATE animals SET status=$1 WHERE id=$2', [newStatus, id]);
    }

    const result = await db.query(
      `INSERT INTO animal_events
         (animal_id, farm_id, event_type, event_date, counterpart, price,
          cause_of_death, destination_farm, responsible_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, farmId, event_type,
       event_date || new Date().toISOString().split('T')[0],
       counterpart, price, cause_of_death, destination_farm,
       req.user.id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { list, get, create, update, registerEvent };