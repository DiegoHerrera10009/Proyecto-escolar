-- Existencias por código de herramienta (inventario preset herramientas / equipos_inventario)

ALTER TABLE equipos_inventario
    ADD COLUMN IF NOT EXISTS cantidad INTEGER NOT NULL DEFAULT 1;
