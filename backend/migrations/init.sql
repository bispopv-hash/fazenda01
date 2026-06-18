-- =============================================
-- FAZENDA SYSTEM - Schema do Banco de Dados
-- =============================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USUÁRIOS E AUTENTICAÇÃO
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','owner','manager','foreman','vet')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAZENDAS
-- =============================================
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  owner_name VARCHAR(200),
  state VARCHAR(2),
  city VARCHAR(150),
  address TEXT,
  total_area_ha NUMERIC(10,2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fazendas que cada usuário pode acessar
CREATE TABLE user_farms (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, farm_id)
);

-- =============================================
-- PASTOS
-- =============================================
CREATE TABLE pastures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  area_ha NUMERIC(10,2),
  grass_type VARCHAR(100),
  capacity INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RAÇAS
-- =============================================
CREATE TABLE breeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO breeds (name) VALUES
  ('Nelore'),('Angus'),('Brahman'),('Hereford'),('Simental'),
  ('Gir'),('Girolando'),('Guzerá'),('Tabapuã'),('Senepol'),
  ('Brangus'),('Canchim'),('Limousin'),('Charolês'),('Outra');

-- =============================================
-- ANIMAIS
-- =============================================
CREATE TABLE animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,                    -- Número de identificação/brinco
  name VARCHAR(100),
  sex VARCHAR(1) NOT NULL CHECK (sex IN ('M','F')),
  breed_id UUID REFERENCES breeds(id),
  birth_date DATE,
  birth_type VARCHAR(20) DEFAULT 'natural'
    CHECK (birth_type IN ('natural','cesarean','assisted')),
  mother_id UUID REFERENCES animals(id),
  father_id UUID REFERENCES animals(id),
  current_pasture_id UUID REFERENCES pastures(id),
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active','sold','dead','transferred')),
  entry_type VARCHAR(20) DEFAULT 'birth'
    CHECK (entry_type IN ('birth','purchase','transfer')),
  entry_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (farm_id, tag)
);

-- =============================================
-- PESAGENS
-- =============================================
CREATE TABLE weightings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id),
  weight_kg NUMERIC(8,2) NOT NULL,
  weighting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responsible_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MANEJOS
-- =============================================
CREATE TABLE management_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) CHECK (category IN (
    'vaccine','antiparasitic','vitamin','medication',
    'exam','reproduction','surgery','other'
  ))
);

INSERT INTO management_types (name, category) VALUES
  ('Vacina Febre Aftosa','vaccine'),
  ('Vacina Brucelose','vaccine'),
  ('Vermifugação','antiparasitic'),
  ('Carrapaticida','antiparasitic'),
  ('Vitamina ADE','vitamin'),
  ('Suplementação Mineral','vitamin'),
  ('Ultrassom Reprodutivo','exam'),
  ('Inseminação Artificial','reproduction'),
  ('Transferência de Embrião','reproduction'),
  ('Castração','surgery'),
  ('Descorna','surgery'),
  ('Curativo Geral','other');

CREATE TABLE managements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id),
  management_type_id UUID REFERENCES management_types(id),
  custom_type VARCHAR(150),
  management_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product VARCHAR(200),
  dose VARCHAR(100),
  responsible_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TROCA DE PASTO
-- =============================================
CREATE TABLE pasture_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id),
  from_pasture_id UUID REFERENCES pastures(id),
  to_pasture_id UUID NOT NULL REFERENCES pastures(id),
  move_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responsible_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EVENTOS (compra, venda, morte, transferência)
-- =============================================
CREATE TABLE animal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id),
  event_type VARCHAR(20) NOT NULL
    CHECK (event_type IN ('purchase','sale','death','transfer','birth')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Compra/Venda
  counterpart VARCHAR(200),   -- nome do vendedor ou comprador
  price NUMERIC(12,2),
  -- Morte
  cause_of_death VARCHAR(200),
  -- Transferência
  destination_farm VARCHAR(200),
  responsible_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================
CREATE INDEX idx_animals_farm ON animals(farm_id);
CREATE INDEX idx_animals_pasture ON animals(current_pasture_id);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_weightings_animal ON weightings(animal_id);
CREATE INDEX idx_weightings_farm ON weightings(farm_id);
CREATE INDEX idx_managements_animal ON managements(animal_id);
CREATE INDEX idx_pasture_moves_animal ON pasture_moves(animal_id);
CREATE INDEX idx_animal_events_animal ON animal_events(animal_id);
CREATE INDEX idx_pastures_farm ON pastures(farm_id);

-- =============================================
-- FUNÇÕES DE ATUALIZAÇÃO DE TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_farms_updated BEFORE UPDATE ON farms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pastures_updated BEFORE UPDATE ON pastures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_animals_updated BEFORE UPDATE ON animals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- USUÁRIO ADMIN PADRÃO (senha: Admin@123)
-- =============================================
INSERT INTO users (name, email, password_hash, role) VALUES (
  'Administrador',
  'admin@fazenda.com',
  '$2b$10$rOzJqhcJ3J6Kq3J6Kq3J6OeXJzJ6Kq3J6Kq3J6Kq3J6Kq3J6Kq3',
  'admin'
);
-- ATENÇÃO: Rode o seed.js para criar o admin com hash correto
