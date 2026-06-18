import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db = null;

export async function getDB() {
  if (db) return db;
  db = await SQLite.openDatabase({ name: 'fazenda_local.db', location: 'default' });
  await initSchema(db);
  return db;
}

async function initSchema(database) {
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      error TEXT
    )
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS animals_cache (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      name TEXT,
      sex TEXT,
      breed_name TEXT,
      pasture_name TEXT,
      status TEXT DEFAULT 'active',
      birth_date TEXT,
      last_weight REAL,
      updated_at TEXT
    )
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS pastures_cache (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      name TEXT NOT NULL,
      area_ha REAL,
      grass_type TEXT,
      capacity INTEGER,
      animal_count INTEGER DEFAULT 0
    )
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS management_types_cache (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT
    )
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS local_weightings (
      id TEXT PRIMARY KEY,
      animal_id TEXT NOT NULL,
      farm_id TEXT,
      weight_kg REAL NOT NULL,
      weighting_date TEXT NOT NULL,
      notes TEXT,
      synced INTEGER DEFAULT 0
    )
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS local_managements (
      id TEXT PRIMARY KEY,
      animal_id TEXT NOT NULL,
      farm_id TEXT,
      management_type_id TEXT,
      custom_type TEXT,
      management_date TEXT NOT NULL,
      product TEXT,
      dose TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0
    )
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS local_pasture_moves (
      id TEXT PRIMARY KEY,
      animal_id TEXT NOT NULL,
      to_pasture_id TEXT NOT NULL,
      move_date TEXT NOT NULL,
      notes TEXT,
      synced INTEGER DEFAULT 0
    )
  `);
}

// ---- Sync Queue ----
export async function enqueueOperation(entity, action, payload) {
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.executeSql(
    `INSERT INTO sync_queue (id, entity, action, payload, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [id, entity, action, JSON.stringify(payload), new Date().toISOString()]
  );
  return id;
}

export async function getPendingOperations() {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT * FROM sync_queue WHERE synced=0 ORDER BY timestamp ASC`
  );
  const rows = [];
  for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
  return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
}

export async function markSynced(ids) {
  const db = await getDB();
  for (const id of ids) {
    await db.executeSql(`UPDATE sync_queue SET synced=1 WHERE id=?`, [id]);
  }
}

export async function markError(id, error) {
  const db = await getDB();
  await db.executeSql(`UPDATE sync_queue SET error=? WHERE id=?`, [error, id]);
}

// ---- Animals Cache ----
export async function cacheAnimals(animals) {
  const db = await getDB();
  await db.executeSql(`DELETE FROM animals_cache WHERE farm_id=?`, [animals[0]?.farm_id]);
  for (const a of animals) {
    await db.executeSql(
      `INSERT OR REPLACE INTO animals_cache
         (id,farm_id,tag,name,sex,breed_name,pasture_name,status,birth_date,last_weight,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [a.id, a.farm_id, a.tag, a.name, a.sex, a.breed, a.pasture,
       a.status, a.birth_date, a.last_weight, new Date().toISOString()]
    );
  }
}

export async function getCachedAnimals(farmId) {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT * FROM animals_cache WHERE farm_id=? AND status='active' ORDER BY tag`,
    [farmId]
  );
  const rows = [];
  for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
  return rows;
}

// ---- Pastures Cache ----
export async function cachePastures(farmId, pastures) {
  const db = await getDB();
  await db.executeSql(`DELETE FROM pastures_cache WHERE farm_id=?`, [farmId]);
  for (const p of pastures) {
    await db.executeSql(
      `INSERT OR REPLACE INTO pastures_cache (id,farm_id,name,area_ha,grass_type,capacity,animal_count)
       VALUES (?,?,?,?,?,?,?)`,
      [p.id, farmId, p.name, p.area_ha, p.grass_type, p.capacity, p.animal_count]
    );
  }
}

export async function getCachedPastures(farmId) {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT * FROM pastures_cache WHERE farm_id=? ORDER BY name`, [farmId]
  );
  const rows = [];
  for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
  return rows;
}

// ---- Management Types Cache ----
export async function cacheManagementTypes(types) {
  const db = await getDB();
  await db.executeSql(`DELETE FROM management_types_cache`);
  for (const t of types) {
    await db.executeSql(
      `INSERT OR REPLACE INTO management_types_cache (id, name, category) VALUES (?,?,?)`,
      [t.id, t.name, t.category]
    );
  }
}

export async function getCachedManagementTypes() {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT * FROM management_types_cache ORDER BY category, name`
  );
  const rows = [];
  for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
  return rows;
}

export async function getPendingCount() {
  const db = await getDB();
  const [result] = await db.executeSql(
    `SELECT COUNT(*) as count FROM sync_queue WHERE synced=0`
  );
  return result.rows.item(0).count;
}
