CREATE TABLE orders (
    id UUID PRIMARY KEY,
    client_name VARCHAR(120) NOT NULL,
    client_document VARCHAR(20) NOT NULL,
    client_email VARCHAR(120) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_orders_amounts CHECK (total >= 0 AND discount >= 0 AND discount <= subtotal)
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders (id),
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(160) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    CONSTRAINT ck_order_items_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);

CREATE TABLE discount_rule (
    id BIGSERIAL PRIMARY KEY,
    minimum_amount NUMERIC(12, 2) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_discount_rule CHECK (minimum_amount >= 0 AND percentage > 0 AND percentage <= 100)
);
