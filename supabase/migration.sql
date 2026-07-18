-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Bats', 'Balls', 'Gloves', 'Pads', 'Helmets', 'Accessories', 'Bags', 'Clothing')),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_threshold >= 0),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sales Log Table
CREATE TABLE IF NOT EXISTS sales_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
    sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
    sold_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Index for performance on searches/joins
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_sales_log_equipment_id ON sales_log(equipment_id);

-- Stored Procedure to safely log a sale in a single database transaction.
-- This ensures stock integrity and consistency.
CREATE OR REPLACE FUNCTION log_sale(
    p_equipment_id UUID,
    p_quantity_sold INTEGER,
    p_sale_price NUMERIC
) RETURNS INTEGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Check if the equipment exists and lock the row for update to prevent race conditions
    SELECT current_stock INTO v_current_stock
    FROM equipment
    WHERE id = p_equipment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipment item not found.';
    END IF;

    -- Check if there is enough stock
    IF v_current_stock < p_quantity_sold THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity_sold;
    END IF;

    -- Calculate new stock
    v_new_stock := v_current_stock - p_quantity_sold;

    -- Update the equipment stock
    UPDATE equipment
    SET current_stock = v_new_stock
    WHERE id = p_equipment_id;

    -- Log the sale record
    INSERT INTO sales_log (equipment_id, quantity_sold, sale_price)
    VALUES (p_equipment_id, p_quantity_sold, p_sale_price);

    RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;
