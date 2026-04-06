-- Rol cuyo usuario ve el flujo en «Disponibles» e inicia la ejecución (ej. solo TECNICO).
-- El supervisor u otros roles siguen viendo el turno en «Mis actividades» cuando corresponda.

ALTER TABLE tareas_campo ADD COLUMN IF NOT EXISTS menu_inicio_rol VARCHAR(50) NOT NULL DEFAULT 'TECNICO';

UPDATE tareas_campo
SET menu_inicio_rol = 'TECNICO'
WHERE menu_inicio_rol IS NULL OR TRIM(menu_inicio_rol) = '';
