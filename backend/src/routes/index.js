const router = require('express').Router();
const { auth, requireRole, requireFarmAccess } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const farmCtrl = require('../controllers/farmController');
const pastureCtrl = require('../controllers/pastureController');
const animalCtrl = require('../controllers/animalController');
const weightCtrl = require('../controllers/weightingController');
const mgmtCtrl = require('../controllers/managementController');
const moveCtrl = require('../controllers/pastureMoveController');
const reportCtrl = require('../controllers/reportController');
const syncCtrl = require('../controllers/syncController');

// =============================================
// AUTH
// =============================================
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);
router.post('/auth/register', auth, requireRole('admin'), authCtrl.register);

// =============================================
// FAZENDAS
// =============================================
router.get('/farms', auth, farmCtrl.list);
router.post('/farms', auth, requireRole('admin','owner'), farmCtrl.create);
router.get('/farms/:id', auth, requireFarmAccess, farmCtrl.get);
router.put('/farms/:id', auth, requireRole('admin','owner','manager'), requireFarmAccess, farmCtrl.update);
router.delete('/farms/:id', auth, requireRole('admin'), farmCtrl.remove);
router.get('/farms/:id/dashboard', auth, requireFarmAccess, farmCtrl.dashboard);

// =============================================
// PASTOS
// =============================================
router.get('/farms/:farmId/pastures', auth, requireFarmAccess, pastureCtrl.list);
router.post('/farms/:farmId/pastures', auth, requireRole('admin','owner','manager'), requireFarmAccess, pastureCtrl.create);
router.get('/pastures/:id', auth, pastureCtrl.get);
router.put('/pastures/:id', auth, requireRole('admin','owner','manager'), pastureCtrl.update);
router.delete('/pastures/:id', auth, requireRole('admin','owner','manager'), pastureCtrl.remove);
router.get('/pastures/:id/animals', auth, pastureCtrl.animals);

// =============================================
// ANIMAIS
// =============================================
router.get('/farms/:farmId/animals', auth, requireFarmAccess, animalCtrl.list);
router.post('/farms/:farmId/animals', auth, requireFarmAccess, animalCtrl.create);
router.get('/animals/:id', auth, animalCtrl.get);
router.put('/animals/:id', auth, requireRole('admin','owner','manager','foreman'), animalCtrl.update);
router.post('/animals/:id/events', auth, requireRole('admin','owner','manager','foreman'), animalCtrl.registerEvent);

// =============================================
// PESAGENS
// =============================================
router.get('/animals/:animalId/weightings', auth, weightCtrl.list);
router.post('/animals/:animalId/weightings', auth, weightCtrl.create);
router.delete('/weightings/:id', auth, requireRole('admin','owner','manager'), weightCtrl.remove);
router.post('/farms/:farmId/weightings/batch', auth, requireFarmAccess, weightCtrl.batchCreate);

// =============================================
// MANEJOS
// =============================================
router.get('/management-types', auth, mgmtCtrl.listTypes);
router.post('/management-types', auth, requireRole('admin','owner','manager'), mgmtCtrl.createType);
router.put('/management-types/:id', auth, requireRole('admin','owner','manager'), mgmtCtrl.updateType);
router.delete('/management-types/:id', auth, requireRole('admin','owner','manager'), mgmtCtrl.removeType);
router.get('/animals/:animalId/managements', auth, mgmtCtrl.list);
router.post('/animals/:animalId/managements', auth, mgmtCtrl.create);
router.post('/farms/:farmId/managements/batch', auth, requireFarmAccess, mgmtCtrl.batchCreate);

// =============================================
// TROCA DE PASTO
// =============================================
router.get('/animals/:animalId/pasture-moves', auth, moveCtrl.list);
router.post('/animals/:animalId/pasture-moves', auth, moveCtrl.create);
router.post('/farms/:farmId/pasture-moves/batch', auth, requireFarmAccess, moveCtrl.batchMove);

// =============================================
// RAÇAS
// =============================================
router.get('/breeds', auth, async (req, res) => {
  const db = require('../utils/db');
  const r = await db.query('SELECT * FROM breeds ORDER BY name');
  res.json(r.rows);
});

// =============================================
// USUÁRIOS (admin)
// =============================================
router.get('/users', auth, requireRole('admin','owner'), async (req, res) => {
  const db = require('../utils/db');
  const r = await db.query('SELECT id, name, email, role, active, created_at FROM users ORDER BY name');
  res.json(r.rows);
});

router.get('/users/:id/farms', auth, requireRole('admin', 'owner'), async (req, res) => {
  const db = require('../utils/db');
  const r = await db.query(
    'SELECT f.id, f.name FROM farms f JOIN user_farms uf ON uf.farm_id=f.id WHERE uf.user_id=$1 ORDER BY f.name',
    [req.params.id]
  );
  res.json(r.rows);
});

router.put('/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const db = require('../utils/db');
    const bcrypt = require('bcrypt');
    const { name, role, active, farm_ids, password } = req.body;
    const updates = ['name=$1', 'role=$2', 'active=$3'];
    const values = [name, role, active];
    if (password && password.trim()) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash=$${values.length + 1}`);
      values.push(hash);
    }
    values.push(req.params.id);
    const r = await db.query(
      `UPDATE users SET ${updates.join(',')} WHERE id=$${values.length} RETURNING id,name,email,role,active`,
      values
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (farm_ids !== undefined) {
      await db.query('DELETE FROM user_farms WHERE user_id=$1', [req.params.id]);
      for (const fid of (farm_ids || [])) {
        await db.query('INSERT INTO user_farms (user_id, farm_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, fid]);
      }
    }
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// RELATÓRIOS
// =============================================
router.get('/farms/:farmId/reports/breed', auth, requireFarmAccess, reportCtrl.byBreed);
router.get('/farms/:farmId/reports/weight-gain', auth, requireFarmAccess, reportCtrl.weightGain);
router.get('/farms/:farmId/reports/events', auth, requireFarmAccess, reportCtrl.events);
router.get('/farms/:farmId/reports/managements', auth, requireFarmAccess, reportCtrl.managements);

// =============================================
// SINCRONIZAÇÃO OFFLINE
// =============================================
router.post('/sync', auth, syncCtrl.sync);

module.exports = router;
