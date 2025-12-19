-- database/migrations/006_products_advanced_schema.sql
-- ===========================================
-- MÓDULO AVANZADO DE PRODUCTOS
-- ===========================================

-- ===========================================
-- EXTENSIÓN: Crear categorías y familias
-- ===========================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  cuit VARCHAR(13),
  email VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  contact_name VARCHAR(150),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- ACTUALIZAR TABLA products CON CAMPOS AVANZADOS
-- ===========================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES product_brands(id),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id),
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES product_suppliers(id),
  ADD COLUMN IF NOT EXISTS subfamily VARCHAR(100),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50),
  
  -- Dimensiones y logística
  ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 3),
  ADD COLUMN IF NOT EXISTS height DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS width DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS depth DECIMAL(10, 2),
  
  -- Galería de imágenes (array de URLs)
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  
  -- Flags especiales
  ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS discounts_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_giftcard BOOLEAN DEFAULT false,
  
  -- Gestión de stock
  ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS optimal_stock INTEGER,
  
  -- Metadata adicional
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ===========================================
-- TABLA: Stock por sucursal
-- ===========================================
CREATE TABLE IF NOT EXISTS product_stock_by_branch (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  reserved INTEGER DEFAULT 0,
  available INTEGER GENERATED ALWAYS AS (stock - reserved) STORED,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_branch ON product_stock_by_branch(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_product ON product_stock_by_branch(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_low ON product_stock_by_branch(product_id, branch_id) 
  WHERE stock <= min_stock;

-- ===========================================
-- TABLA: Kardex (Historial de movimientos)
-- ===========================================
CREATE TABLE IF NOT EXISTS product_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'damage'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit_cost DECIMAL(12, 2),
  reference_id UUID, -- ID de venta, compra o transferencia
  reference_type VARCHAR(30), -- 'sale', 'purchase', 'transfer'
  reason TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON product_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_branch ON product_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON product_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON product_movements(type);

-- ===========================================
-- TABLA: Transferencias entre sucursales
-- ===========================================
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number VARCHAR(20) UNIQUE NOT NULL,
  from_branch_id UUID REFERENCES branches(id) NOT NULL,
  to_branch_id UUID REFERENCES branches(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'in_transit', 'completed', 'cancelled'
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity_requested INTEGER NOT NULL,
  quantity_sent INTEGER,
  quantity_received INTEGER,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON stock_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON stock_transfers(to_branch_id);

-- ===========================================
-- TABLA: Gift Cards
-- ===========================================
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50) UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  initial_balance DECIMAL(12, 2),
  current_balance DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  sale_id UUID REFERENCES sales(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_giftcards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_giftcards_barcode ON gift_cards(barcode);
CREATE INDEX IF NOT EXISTS idx_giftcards_active ON gift_cards(is_active) WHERE is_active = true;

-- ===========================================
-- TABLA: Órdenes de pedido a proveedores
-- ===========================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES product_suppliers(id),
  branch_id UUID REFERENCES branches(id),
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'received', 'cancelled'
  total DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  received_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity_requested INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(12, 2),
  subtotal DECIMAL(12, 2)
);

-- ===========================================
-- FUNCIÓN: Actualizar stock tras venta
-- ===========================================
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el producto descuenta stock
  IF EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND discounts_stock = true) THEN
    UPDATE product_stock_by_branch
    SET 
      stock = stock - NEW.quantity,
      updated_at = NOW()
    WHERE product_id = NEW.product_id 
      AND branch_id = (SELECT branch_id FROM sales WHERE id = NEW.sale_id);
    
    -- Registrar en kardex
    INSERT INTO product_movements (
      product_id, 
      branch_id, 
      type, 
      quantity, 
      previous_stock,
      new_stock,
      reference_id, 
      reference_type,
      user_id
    )
    SELECT 
      NEW.product_id,
      s.branch_id,
      'sale',
      -NEW.quantity,
      psb.stock + NEW.quantity,
      psb.stock,
      NEW.sale_id,
      'sale',
      s.user_id
    FROM sales s
    JOIN product_stock_by_branch psb ON psb.product_id = NEW.product_id AND psb.branch_id = s.branch_id
    WHERE s.id = NEW.sale_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_after_sale ON sale_items;
CREATE TRIGGER trigger_update_stock_after_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_sale();

-- ===========================================
-- FUNCIÓN: Transferencia de stock
-- ===========================================
CREATE OR REPLACE FUNCTION complete_stock_transfer(
  p_transfer_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_from_branch UUID;
  v_to_branch UUID;
  v_item RECORD;
BEGIN
  -- Obtener sucursales
  SELECT from_branch_id, to_branch_id INTO v_from_branch, v_to_branch
  FROM stock_transfers
  WHERE id = p_transfer_id;
  
  -- Procesar cada item
  FOR v_item IN 
    SELECT product_id, quantity_sent
    FROM stock_transfer_items
    WHERE transfer_id = p_transfer_id
  LOOP
    -- Descontar de sucursal origen
    UPDATE product_stock_by_branch
    SET stock = stock - v_item.quantity_sent
    WHERE product_id = v_item.product_id AND branch_id = v_from_branch;
    
    -- Sumar a sucursal destino
    INSERT INTO product_stock_by_branch (product_id, branch_id, stock)
    VALUES (v_item.product_id, v_to_branch, v_item.quantity_sent)
    ON CONFLICT (product_id, branch_id)
    DO UPDATE SET stock = product_stock_by_branch.stock + v_item.quantity_sent;
    
    -- Kardex origen
    INSERT INTO product_movements (
      product_id, branch_id, type, quantity, 
      previous_stock, new_stock, reference_id, reference_type, user_id
    )
    SELECT 
      v_item.product_id, v_from_branch, 'transfer_out', -v_item.quantity_sent,
      stock + v_item.quantity_sent, stock, p_transfer_id, 'transfer', p_user_id
    FROM product_stock_by_branch
    WHERE product_id = v_item.product_id AND branch_id = v_from_branch;
    
    -- Kardex destino
    INSERT INTO product_movements (
      product_id, branch_id, type, quantity,
      previous_stock, new_stock, reference_id, reference_type, user_id
    )
    SELECT 
      v_item.product_id, v_to_branch, 'transfer_in', v_item.quantity_sent,
      stock - v_item.quantity_sent, stock, p_transfer_id, 'transfer', p_user_id
    FROM product_stock_by_branch
    WHERE product_id = v_item.product_id AND branch_id = v_to_branch;
  END LOOP;
  
  -- Actualizar estado de transferencia
  UPDATE stock_transfers
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VISTA: Productos con stock bajo
-- ===========================================
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
  p.id,
  p.code,
  p.barcode,
  p.name,
  pc.name as category_name,
  pb.name as brand_name,
  psb.branch_id,
  b.name as branch_name,
  psb.stock as current_stock,
  psb.min_stock,
  psb.available,
  (psb.min_stock - psb.stock) as needed_quantity,
  ps.name as supplier_name,
  ps.email as supplier_email,
  ps.phone as supplier_phone
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_brands pb ON p.brand_id = pb.id
LEFT JOIN product_suppliers ps ON p.supplier_id = ps.id
JOIN product_stock_by_branch psb ON p.id = psb.product_id
JOIN branches b ON psb.branch_id = b.id
WHERE psb.stock <= psb.min_stock
  AND p.is_active = true
  AND p.discounts_stock = true
ORDER BY (psb.min_stock - psb.stock) DESC;

-- ===========================================
-- DATOS INICIALES
-- ===========================================

-- Categorías de ejemplo
INSERT INTO product_categories (name, description) VALUES
  ('Electrónica', 'Dispositivos electrónicos y accesorios'),
  ('Alimentos', 'Productos alimenticios'),
  ('Bebidas', 'Bebidas alcohólicas y no alcohólicas'),
  ('Limpieza', 'Productos de limpieza'),
  ('Indumentaria', 'Ropa y calzado')
ON CONFLICT (name) DO NOTHING;

-- Marcas de ejemplo
INSERT INTO product_brands (name) VALUES
  ('Sin marca'),
  ('Genérico'),
  ('Premium')
ON CONFLICT (name) DO NOTHING;