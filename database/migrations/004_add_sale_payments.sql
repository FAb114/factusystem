-- database/migrations/002_add_sale_payments.sql

-- ===========================================
-- TABLA: sale_payments (Pagos de ventas)
-- ===========================================
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'approved',
  transaction_id VARCHAR(100),
  authorization_code VARCHAR(50),
  card_last_digits VARCHAR(4),
  card_brand VARCHAR(20),
  installments INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- AGREGAR COLUMNAS A sales
-- ===========================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_methods TEXT[];
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cae VARCHAR(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cae_expiration DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ===========================================
-- AGREGAR COLUMNAS A sale_items
-- ===========================================
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(200);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(50);

-- ===========================================
-- ÍNDICES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_cae ON sales(cae);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_type ON sales(invoice_type);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- ===========================================
-- FUNCIÓN: Decrementar stock
-- ===========================================
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = stock - quantity,
      updated_at = NOW()
  WHERE id = product_id AND stock >= quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- FUNCIÓN: Incrementar stock
-- ===========================================
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = stock + quantity,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- TRIGGER: Verificar stock antes de venta
-- ===========================================
CREATE OR REPLACE FUNCTION check_stock_before_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    IF (SELECT stock FROM products WHERE id = NEW.product_id) < NEW.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_stock_trigger ON sale_items;
CREATE TRIGGER check_stock_trigger
  BEFORE INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_before_sale();