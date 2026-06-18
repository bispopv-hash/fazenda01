require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

async function seed() {
  console.log('🌱 Iniciando seed...');
  try {
    // Remove admin se já existir
    await db.query("DELETE FROM users WHERE email = 'admin@fazenda.com'");

    const hash = await bcrypt.hash('Admin@123', 10);
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      ['Administrador', 'admin@fazenda.com', hash, 'admin']
    );
    console.log('✅ Admin criado: admin@fazenda.com / Admin@123');

    // Fazenda de exemplo
    const farmRes = await db.query(
      `INSERT INTO farms (name, owner_name, state, city, total_area_ha)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Fazenda Exemplo', 'João da Silva', 'MT', 'Cuiabá', 500]
    );
    const farmId = farmRes.rows[0].id;
    console.log('✅ Fazenda de exemplo criada:', farmId);

    // Vincula admin à fazenda
    await db.query(
      `INSERT INTO user_farms (user_id, farm_id)
       SELECT id, $1 FROM users WHERE email = 'admin@fazenda.com'`,
      [farmId]
    );

    // Pastos de exemplo
    await db.query(
      `INSERT INTO pastures (farm_id, name, area_ha, grass_type, capacity) VALUES
       ($1,'Pasto 1',50,'Brachiaria brizantha',80),
       ($1,'Pasto 2',40,'Panicum maximum',60),
       ($1,'Pasto 3',60,'Brachiaria decumbens',100)`,
      [farmId]
    );
    console.log('✅ Pastos de exemplo criados');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('   Login: admin@fazenda.com');
    console.log('   Senha: Admin@123');
  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
