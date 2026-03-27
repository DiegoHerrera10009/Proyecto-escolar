-- Actualiza la restriccion de estados en tareas_campo
-- para el nuevo flujo:
-- PENDIENTE, EN_PROCESO, PENDIENTE_APROBACION, TERMINADA, CANCELADA

-- 1) Normalizar datos viejos (si existian)
UPDATE tareas_campo
SET estado = 'TERMINADA'
WHERE estado IN ('COMPLETADA', 'APROBADA');

UPDATE tareas_campo
SET estado = 'CANCELADA'
WHERE estado = 'RECHAZADA';

-- 2) Quitar restriccion anterior (si existe)
ALTER TABLE tareas_campo
DROP CONSTRAINT IF EXISTS tareas_campo_estado_check;

-- 3) Crear nueva restriccion
ALTER TABLE tareas_campo
ADD CONSTRAINT tareas_campo_estado_check
CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'TERMINADA', 'CANCELADA'));

