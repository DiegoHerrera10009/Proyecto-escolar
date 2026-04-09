-- Ajusta la restricción de rol responsable en pasos del flujo
-- al conjunto usado en esta práctica.

ALTER TABLE etapas_tarea_campo
  DROP CONSTRAINT IF EXISTS etapas_tarea_campo_rol_responsable_check;

UPDATE etapas_tarea_campo
SET rol_responsable = CASE
  WHEN rol_responsable = 'DESPACHO' THEN 'BODEGA'
  WHEN rol_responsable IN ('BODEGA', 'COMPRAS', 'COMERCIAL') THEN rol_responsable
  ELSE 'BODEGA'
END
WHERE rol_responsable IS NULL
   OR rol_responsable NOT IN ('BODEGA', 'COMPRAS', 'COMERCIAL');

ALTER TABLE etapas_tarea_campo
  ADD CONSTRAINT etapas_tarea_campo_rol_responsable_check
  CHECK (rol_responsable IN ('BODEGA', 'COMPRAS', 'COMERCIAL'));
