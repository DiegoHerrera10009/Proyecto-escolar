-- Columnas visibles por catálogo (JSON array de claves: nombre, serial, responsable, estado, ubicacion)
ALTER TABLE inventario_catalogos
  ADD COLUMN IF NOT EXISTS columnas_json VARCHAR(2000);
