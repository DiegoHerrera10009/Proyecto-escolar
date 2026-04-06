-- Catálogos de inventario definidos por el usuario (ej. Computadores, Vehículos)
-- y sus ítems. Hibernate también puede crear/actualizar estas tablas (ddl-auto: update).

CREATE TABLE IF NOT EXISTS inventario_catalogos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS inventario_items (
    id BIGSERIAL PRIMARY KEY,
    catalogo_id BIGINT NOT NULL REFERENCES inventario_catalogos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    serial VARCHAR(255),
    responsable VARCHAR(255),
    estado VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(255),
    CONSTRAINT uq_inventario_items_catalogo_serial UNIQUE (catalogo_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_inventario_items_catalogo ON inventario_items(catalogo_id);
