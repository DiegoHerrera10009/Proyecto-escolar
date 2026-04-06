-- Mejoras de rendimiento para flujos BPM.
-- Ejecutar en la BD erp_susequid después de 06.

-- 1) Índice para buscar ejecuciones por plantilla
CREATE INDEX IF NOT EXISTS idx_tareas_campo_plantilla_flujo
  ON tareas_campo(plantilla_flujo_id);

-- 2) Índice compuesto para etapas por tarea y orden
CREATE INDEX IF NOT EXISTS idx_etapas_tarea_campo_tarea_orden
  ON etapas_tarea_campo(tarea_id, orden);

-- 3) Índice para filtrar tareas por estado y tipo (plantilla vs ejecución)
CREATE INDEX IF NOT EXISTS idx_tareas_campo_plantilla_estado
  ON tareas_campo(es_plantilla_flujo, estado);
