# 🐄 Sistema de Gerenciamento de Fazendas

Sistema completo com portal web, API backend e aplicativo mobile com suporte offline.

---

## 📁 Estrutura do Projeto

```
fazenda-system/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/                        # API Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   ├── migrations/
│   │   └── init.sql                # Schema completo PostgreSQL
│   └── src/
│       ├── index.js                # Entry point
│       ├── controllers/            # Lógica de negócio
│       │   ├── authController.js
│       │   ├── farmController.js
│       │   ├── pastureController.js
│       │   ├── animalController.js
│       │   ├── weightingController.js
│       │   ├── managementController.js
│       │   ├── pastureMoveController.js
│       │   ├── reportController.js
│       │   └── syncController.js
│       ├── middleware/
│       │   └── auth.js             # JWT + RBAC
│       ├── routes/
│       │   └── index.js
│       └── utils/
│           ├── db.js               # Pool PostgreSQL
│           └── seed.js             # Dados iniciais
│
├── web/                            # Portal React
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── index.css
│       ├── services/
│       │   └── api.js              # Axios + interceptors
│       ├── context/
│       │   └── AuthContext.js
│       ├── components/layout/
│       │   ├── Sidebar.js
│       │   └── Layout.js
│       └── pages/
│           ├── LoginPage.js
│           ├── DashboardPage.js
│           ├── AnimalsPage.js
│           ├── AnimalDetailPage.js
│           ├── PasturesPage.js
│           ├── ReportsPage.js
│           ├── FarmsPage.js
│           └── UsersPage.js
│
└── mobile/                         # App React Native (Android)
    ├── App.js
    ├── index.js
    ├── app.json
    ├── package.json
    ├── metro.config.js
    ├── babel.config.js
    ├── android/                    # Projeto Android nativo
    └── src/
        ├── navigation/
        │   └── AppNavigator.js
        ├── context/
        │   └── AppContext.js       # Estado global + sync automático
        ├── services/
        │   ├── apiService.js       # Chamadas HTTP + cache offline
        │   └── localDB.js          # SQLite local (fila offline)
        └── screens/
            ├── LoginScreen.js
            ├── DashboardScreen.js
            ├── AnimalsScreen.js
            ├── AnimalDetailScreen.js
            ├── AnimalFormScreen.js
            ├── PasturesScreen.js
            └── SyncScreen.js
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Android Studio (para o app mobile)
- Java 17 (para build Android)

---

### 1. Backend

```bash
cd fazenda-system

# Copiar variáveis de ambiente
cp .env.example .env

# Subir PostgreSQL
docker-compose up -d postgres

# Aguardar o banco inicializar (~5 segundos), depois:
cd backend
npm install

# Rodar as migrations e criar usuário admin
npm run seed

# Iniciar o backend em modo dev
npm run dev
```

O backend estará em: **http://localhost:3001**
Health check: **http://localhost:3001/health**

**Credenciais do admin padrão:**
- Email: `admin@fazenda.com`
- Senha: `Admin@123`

---

### 2. Portal Web

```bash
cd fazenda-system/web
npm install
npm start
```

O portal estará em: **http://localhost:3000**

---

### 3. App Mobile (Android)

#### Configuração do ambiente

1. Instale o Android Studio e o SDK 34
2. Configure as variáveis de ambiente:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

#### Instalar dependências

```bash
cd fazenda-system/mobile
npm install
```

#### Configurar o IP da API

Edite `src/services/apiService.js`:

```js
// Emulador Android → use 10.0.2.2 (aponta para localhost da máquina)
const BASE_URL = 'http://10.0.2.2:3001/api';

// Dispositivo físico → use o IP real da sua máquina na rede local
// const BASE_URL = 'http://192.168.1.100:3001/api';
```

#### Rodar no emulador/dispositivo

```bash
# Iniciar o emulador pelo Android Studio, depois:
npx react-native run-android

# Ou em dispositivo físico (com depuração USB ativada):
npx react-native run-android --device
```

---

### 4. Docker Compose completo (backend + web + banco)

```bash
cd fazenda-system
cp .env.example .env
docker-compose up --build
```

- Backend: http://localhost:3001
- Portal web: http://localhost:3000
- PostgreSQL: porta 5432

---

## 🔐 Perfis de Usuário

| Perfil | Permissões |
|--------|-----------|
| **admin** | Acesso total, gerencia usuários e fazendas |
| **owner** (proprietário) | Acesso total à sua fazenda |
| **manager** (gerente) | Gerencia animais, pastos, manejos |
| **foreman** (capataz) | Lança pesagens, manejos e trocas de pasto |
| **vet** (veterinário) | Lança manejos e visualiza histórico |

---

## 📡 Endpoints da API

### Autenticação
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/register       (admin)
```

### Fazendas
```
GET    /api/farms
POST   /api/farms
GET    /api/farms/:id
PUT    /api/farms/:id
DELETE /api/farms/:id
GET    /api/farms/:id/dashboard
```

### Pastos
```
GET    /api/farms/:farmId/pastures
POST   /api/farms/:farmId/pastures
GET    /api/pastures/:id
PUT    /api/pastures/:id
DELETE /api/pastures/:id
GET    /api/pastures/:id/animals
```

### Animais
```
GET    /api/farms/:farmId/animals
POST   /api/farms/:farmId/animals
GET    /api/animals/:id
PUT    /api/animals/:id
POST   /api/animals/:id/events      (venda, morte, transferência)
```

### Pesagens
```
GET    /api/animals/:animalId/weightings
POST   /api/animals/:animalId/weightings
POST   /api/farms/:farmId/weightings/batch
DELETE /api/weightings/:id
```

### Manejos
```
GET    /api/management-types
GET    /api/animals/:animalId/managements
POST   /api/animals/:animalId/managements
POST   /api/farms/:farmId/managements/batch
```

### Troca de Pasto
```
GET    /api/animals/:animalId/pasture-moves
POST   /api/animals/:animalId/pasture-moves
POST   /api/farms/:farmId/pasture-moves/batch
```

### Relatórios
```
GET    /api/farms/:farmId/reports/breed
GET    /api/farms/:farmId/reports/weight-gain
GET    /api/farms/:farmId/reports/events
GET    /api/farms/:farmId/reports/managements
```

### Sincronização offline
```
POST   /api/sync
```

Payload:
```json
{
  "operations": [
    {
      "type": "weighting:create",
      "data": { "animal_id": "...", "weight_kg": 320, "weighting_date": "2024-06-01" }
    },
    {
      "type": "management:create",
      "data": { "animal_id": "...", "management_type_id": "...", "management_date": "2024-06-01" }
    }
  ]
}
```

Tipos suportados: `weighting:create`, `management:create`, `pasture_move:create`, `animal_event:create`, `animal:create`

---

## 📱 Funcionamento Offline do App

1. **Sem internet:** dados são salvos na fila local SQLite (`sync_queue`)
2. **Ao reconectar:** `NetInfo` detecta a conexão e dispara `syncPendingOperations()` automaticamente
3. **Sincronização manual:** disponível na aba "Sync" do app
4. **Cache:** animais e pastos são cacheados localmente para leitura offline

---

## 🛠 Variáveis de Ambiente (.env)

```env
# Backend
PORT=3001
NODE_ENV=development
JWT_SECRET=troque-por-chave-segura-em-producao
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fazenda_db
DB_USER=fazenda_user
DB_PASSWORD=fazenda_pass

# Web
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 🗄 Banco de Dados

O schema é criado automaticamente pelo `npm run seed`.

Tabelas principais:
- `users` — usuários do sistema
- `farms` — fazendas
- `user_farms` — vínculo usuário ↔ fazenda com role
- `pastures` — pastos por fazenda
- `breeds` — raças
- `animals` — rebanho
- `weightings` — histórico de pesagens
- `management_types` — tipos de manejo (vacina, vermifugação, etc)
- `managements` — registros de manejo por animal
- `pasture_moves` — histórico de troca de pasto
- `animal_events` — compra, venda, morte, transferência, nascimento

---

## 🏗 Deploy com Docker Compose

```bash
# Produção
docker-compose up -d --build

# Verificar logs
docker-compose logs -f backend

# Parar tudo
docker-compose down

# Remover volumes (apaga o banco!)
docker-compose down -v
```
