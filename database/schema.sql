-- ===========================================
-- FACTUSYSTEM - DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ===========================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- TABLA: users (Usuarios)
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(20) DEFAULT 'seller',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: branches (Sucursales)
-- ===========================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(50),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(150),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: products (Productos)
-- ===========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  unit VARCHAR(10) DEFAULT 'un',
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost DECIMAL(12, 2) DEFAULT 0,
  iva_rate DECIMAL(5, 2) DEFAULT 21.00,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: clients (Clientes)
-- ===========================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) DEFAULT 'individual',
  document_type VARCHAR(10),
  document_number VARCHAR(20),
  cuit VARCHAR(13),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(50),
  zip_code VARCHAR(10),
  iva_condition VARCHAR(50),
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  current_balance DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: sales (Ventas)
-- ===========================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number VARCHAR(20) UNIQUE NOT NULL,
  invoice_type VARCHAR(10),
  invoice_number VARCHAR(20),
  point_of_sale INTEGER,
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  date TIMESTAMP DEFAULT NOW(),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: sale_items (Items de venta)
-- ===========================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  iva_rate DECIMAL(5, 2) DEFAULT 21.00,
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: cash_sessions (Sesiones de caja)
-- ===========================================
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES users(id),
  opening_date TIMESTAMP NOT NULL,
  closing_date TIMESTAMP,
  opening_amount DECIMAL(12, 2) NOT NULL,
  closing_amount DECIMAL(12, 2),
  expected_amount DECIMAL(12, 2),
  difference DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: cash_movements (Movimientos de caja)
-- ===========================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  reference VARCHAR(100),
  description TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: suppliers (Proveedores)
-- ===========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  cuit VARCHAR(13),
  email VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABLA: purchases (Compras)
-- ===========================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number VARCHAR(20) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES users(id),
  date TIMESTAMP DEFAULT NOW(),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ===========================================
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_client ON sales(client_id);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_clients_document ON clients(document_number);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);

-- ===========================================
-- FUNCIONES Y TRIGGERS
-- ===========================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DATOS INICIALES
-- ===========================================

-- Usuario administrador por defecto (password: admin)
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@factusystem.com', 
        crypt('admin', gen_salt('bf')), 
        'Administrador', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Sucursal principal
INSERT INTO branches (name, code, address, city, province)
VALUES ('Sucursal Principal', 'SUC001', 'Av. Principal 1234', 'Buenos Aires', 'Buenos Aires')
ON CONFLICT (code) DO NOTHING;