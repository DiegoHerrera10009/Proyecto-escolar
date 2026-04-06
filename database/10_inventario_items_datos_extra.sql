-- Valores de columnas personalizadas por ítem (JSON objeto clave → texto)
ALTER TABLE inventario_items
  ADD COLUMN IF NOT EXISTS datos_extra_json VARCHAR(4000);
