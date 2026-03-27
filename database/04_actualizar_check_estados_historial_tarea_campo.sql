-- Actualiza restricciones de estado en historial_tarea_campo
-- para el flujo nuevo:
-- PENDIENTE, EN_PROCESO, PENDIENTE_APROBACION, TERMINADA, CANCELADA

-- 1) Normalizar estados historicos (si existen)
UPDATE historial_tarea_campo
SET estado_anterior = 'TERMINADA'
WHERE estado_anterior IN ('COMPLETADA', 'APROBADA');

UPDATE historial_tarea_campo
SET estado_nuevo = 'TERMINADA'
WHERE estado_nuevo IN ('COMPLETADA', 'APROBADA');

UPDATE historial_tarea_campo
SET estado_anterior = 'CANCELADA'
WHERE estado_anterior = 'RECHAZADA';

UPDATE historial_tarea_campo
SET estado_nuevo = 'CANCELADA'
WHERE estado_nuevo = 'RECHAZADA';

-- 2) Remover checks viejos (si existen)
ALTER TABLE historial_tarea_campo DROP CONSTRAINT IF EXISTS historial_tarea_campo_estado_anterior_check;
ALTER TABLE historial_tarea_campo DROP CONSTRAINT IF EXISTS historial_tarea_campo_estado_nuevo_check;

-- 3) Crear checks nuevos
ALTER TABLE historial_tarea_campo
ADD CONSTRAINT historial_tarea_campo_estado_anterior_check
CHECK (estado_anterior IN ('PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'TERMINADA', 'CANCELADA'));

ALTER TABLE historial_tarea_campo
ADD CONSTRAINT historial_tarea_campo_estado_nuevo_check
CHECK (estado_nuevo IN ('PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'TERMINADA', 'CANCELADA'));

