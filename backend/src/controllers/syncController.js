const db = require('../utils/db');

/**
 * Recebe um pacote de operações offline e processa em ordem.
 * Cada operação tem: { id (uuid local), entity, action, payload, timestamp }
 */
const sync = async (req, res) => {
  const { operations } = req.body;
  if (!Array.isArray(operations) || !operations.length) {
    return res.json({ synced: [], errors: [] });
  }

  const synced = [];
  const errors = [];

  for (const op of operations) {
    try {
      const result = await processOperation(op, req.user);
      synced.push({ local_id: op.id, server_id: result?.id, entity: op.entity });
    } catch (err) {
      errors.push({ local_id: op.id, entity: op.entity, error: err.message });
    }
  }

  res.json({ synced, errors, processed_at: new Date().toISOString() });
};

async function processOperation(op, user) {
  const { entity, action, payload } = op;

  switch (`${entity}:${action}`) {
    // --- Pesagens ---
    case 'weighting:create': {
      const r = await db.query(
        `INSERT INTO weightings (animal_id, farm_id, weight_kg, weighting_date, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *`,
        [payload.animal_id, payload.farm_id, payload.weight_kg,
         payload.weighting_date, user.id, payload.notes]
      );
      return r.rows[0];
    }

    // --- Manejos ---
    case 'management:create': {
      const r = await db.query(
        `INSERT INTO managements
           (animal_id, farm_id, management_type_id, custom_type, management_date,
            product, dose, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING *`,
        [payload.animal_id, payload.farm_id, payload.management_type_id,
         payload.custom_type, payload.management_date, payload.product,
         payload.dose, user.id, payload.notes]
      );
      return r.rows[0];
    }

    // --- Troca de pasto ---
    case 'pasture_move:create': {
      const animalRes = await db.query(
        'SELECT current_pasture_id, farm_id FROM animals WHERE id=$1', [payload.animal_id]
      );
      const from = animalRes.rows[0]?.current_pasture_id;
      const farmId = animalRes.rows[0]?.farm_id;

      const r = await db.query(
        `INSERT INTO pasture_moves
           (animal_id, farm_id, from_pasture_id, to_pasture_id, move_date, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING *`,
        [payload.animal_id, farmId, from, payload.to_pasture_id,
         payload.move_date, user.id, payload.notes]
      );
      if (r.rows[0]) {
        await db.query(
          'UPDATE animals SET current_pasture_id=$1 WHERE id=$2',
          [payload.to_pasture_id, payload.animal_id]
        );
      }
      return r.rows[0];
    }

    // --- Eventos (venda, morte etc) ---
    case 'animal_event:create': {
      const r = await db.query(
        `INSERT INTO animal_events
           (animal_id, farm_id, event_type, event_date, counterpart, price,
            cause_of_death, destination_farm, responsible_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING RETURNING *`,
        [payload.animal_id, payload.farm_id, payload.event_type, payload.event_date,
         payload.counterpart, payload.price, payload.cause_of_death,
         payload.destination_farm, user.id, payload.notes]
      );
      if (r.rows[0]) {
        const statusMap = { sale:'sold', death:'dead', transfer:'transferred' };
        const newStatus = statusMap[payload.event_type];
        if (newStatus) {
          await db.query('UPDATE animals SET status=$1 WHERE id=$2', [newStatus, payload.animal_id]);
        }
      }
      return r.rows[0];
    }

    // --- Animais ---
    case 'animal:create': {
      const r = await db.query(
        `INSERT INTO animals
           (farm_id,tag,name,sex,breed_id,birth_date,birth_type,
            mother_id,father_id,current_pasture_id,entry_type,entry_date,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (farm_id,tag) DO NOTHING RETURNING *`,
        [payload.farm_id, payload.tag, payload.name, payload.sex,
         payload.breed_id, payload.birth_date, payload.birth_type || 'natural',
         payload.mother_id, payload.father_id, payload.current_pasture_id,
         payload.entry_type || 'birth', payload.entry_date, payload.notes]
      );
      return r.rows[0];
    }

    default:
      throw new Error(`Operação desconhecida: ${entity}:${action}`);
  }
}

module.exports = { sync };
