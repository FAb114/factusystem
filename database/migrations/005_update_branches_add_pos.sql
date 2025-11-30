-- database/migrations/005_update_branches_add_pos.sql

-- ===========================================
-- ACTUALIZAR TABLA branches CON PUNTO DE VENTA AFIP
-- ===========================================

-- Agregar columna para punto de venta de AFIP
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS afip_pos_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_principal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Crear índice único para punto de venta
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_afip_pos 
ON branches(afip_pos_number);

-- Actualizar la sucursal principal existente
UPDATE branches 
SET 
  afip_pos_number = 1,
  is_principal = true,
  settings = jsonb_build_object(
    'allow_electronic_invoicing', true,
    'allow_cash_management', true,
    'auto_print', true
  )
WHERE code = 'SUC001';

-- Insertar más sucursales de ejemplo
INSERT INTO branches (name, code, address, city, province, afip_pos_number, is_principal, is_active) 
VALUES 
  ('Sucursal Centro', 'SUC002', 'Av. Corrientes 1500', 'CABA', 'Buenos Aires', 2, false, true),
  ('Sucursal Norte', 'SUC003', 'Av. Cabildo 2000', 'CABA', 'Buenos Aires', 3, false, true),
  ('Sucursal Sur', 'SUC004', 'Av. Rivadavia 5000', 'CABA', 'Buenos Aires', 4, false, true)
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- AGREGAR COLUMNAS FALTANTES A LA TABLA users
-- ===========================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Actualizar usuario admin con permisos completos
UPDATE users 
SET 
  permissions = ARRAY['all'],
  is_active = true,
  role = 'admin'
WHERE username = 'admin';

-- ===========================================
-- CREAR TABLA DE RELACIÓN usuarios-sucursales
-- ===========================================

CREATE TABLE IF NOT EXISTS user_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_user_branches_user ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch ON user_branches(branch_id);

-- Asignar todas las sucursales al usuario admin
INSERT INTO user_branches (user_id, branch_id, is_default)
SELECT u.id, b.id, b.is_principal
FROM users u, branches b
WHERE u.username = 'admin'
ON CONFLICT (user_id, branch_id) DO NOTHING;

-- ===========================================
-- ACTUALIZAR TABLA sales PARA MANEJAR MEJOR LOS PUNTOS DE VENTA
-- ===========================================

-- Asegurar que point_of_sale tenga valor por defecto
ALTER TABLE sales 
ALTER COLUMN point_of_sale SET DEFAULT 1,
ALTER COLUMN point_of_sale SET NOT NULL;

-- Crear índice compuesto para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_sales_branch_pos_number 
ON sales(branch_id, point_of_sale, invoice_number);

-- ===========================================
-- FUNCIÓN: Obtener siguiente número de factura
-- ===========================================

CREATE OR REPLACE FUNCTION get_next_invoice_number(
  p_branch_id UUID,
  p_invoice_type VARCHAR(10)
) RETURNS INTEGER AS $$
DECLARE
  v_last_number INTEGER;
  v_pos_number INTEGER;
BEGIN
  -- Obtener el punto de venta de la sucursal
  SELECT afip_pos_number INTO v_pos_number
  FROM branches
  WHERE id = p_branch_id;
  
  -- Si no se encuentra la sucursal, usar 1 por defecto
  IF v_pos_number IS NULL THEN
    v_pos_number := 1;
  END IF;
  
  -- Obtener el último número para este tipo de factura y punto de venta
  SELECT COALESCE(MAX(invoice_number), 0) INTO v_last_number
  FROM sales
  WHERE branch_id = p_branch_id
    AND point_of_sale = v_pos_number
    AND invoice_type = p_invoice_type;
  
  -- Retornar el siguiente número
  RETURN v_last_number + 1;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VISTAS ÚTILES
-- ===========================================

-- Vista de usuarios con sus sucursales
CREATE OR REPLACE VIEW v_users_with_branches AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'code', b.code,
      'afip_pos_number', b.afip_pos_number,
      'is_default', ub.is_default
    )
  ) as branches
FROM users u
LEFT JOIN user_branches ub ON u.id = ub.user_id
LEFT JOIN branches b ON ub.branch_id = b.id
GROUP BY u.id, u.username, u.email, u.full_name, u.role, u.is_active;

-- Vista de sucursales con estadísticas
CREATE OR REPLACE VIEW v_branches_stats AS
SELECT 
  b.id,
  b.name,
  b.code,
  b.afip_pos_number,
  b.is_principal,
  b.is_active,
  COUNT(DISTINCT ub.user_id) as users_count,
  COUNT(DISTINCT s.id) as sales_count,
  COALESCE(SUM(s.total), 0) as total_revenue
FROM branches b
LEFT JOIN user_branches ub ON b.id = ub.branch_id
LEFT JOIN sales s ON b.id = s.branch_id AND s.status = 'completed'
GROUP BY b.id, b.name, b.code, b.afip_pos_number, b.is_principal, b.is_active;