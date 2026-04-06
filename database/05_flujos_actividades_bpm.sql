-- Flujos BPM: plantillas (tareas con es_plantilla_flujo) y ejecuciones con pasos secuenciales (rol + formulario).
-- Ejecutar en la BD erp_susequid después de 03 y 04.

-- 1) Estados ampliados (plantilla borrador/publicada + ejecución)
ALTER TABLE tareas_campo DROP CONSTRAINT IF EXISTS tareas_campo_estado_check;
ALTER TABLE tareas_campo
ADD CONSTRAINT tareas_campo_estado_check
CHECK (estado IN (
  'BORRADOR', 'PUBLICADA',
  'PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'TERMINADA', 'CANCELADA'
));

ALTER TABLE historial_tarea_campo DROP CONSTRAINT IF EXISTS historial_tarea_campo_estado_anterior_check;
ALTER TABLE historial_tarea_campo DROP CONSTRAINT IF EXISTS historial_tarea_campo_estado_nuevo_check;

ALTER TABLE historial_tarea_campo
ADD CONSTRAINT historial_tarea_campo_estado_anterior_check
CHECK (estado_anterior IN (
  'BORRADOR', 'PUBLICADA',
  'PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'TERMINADA', 'CANCELADA'
));

ALTER TABLE historial_tarea_campo
ADD CONSTRAINT historial_tarea_campo_estado_nuevo_check
CHECK (estado_nuevo IN (
  'BORRADOR', 'PUBLICADA',
  'PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'TERMINADA', 'CANCELADA'
));

-- 2) Columnas en tareas_campo
ALTER TABLE tareas_campo ADD COLUMN IF NOT EXISTS es_plantilla_flujo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tareas_campo ADD COLUMN IF NOT EXISTS tipo_visibilidad_flujo VARCHAR(32);
ALTER TABLE tareas_campo ADD COLUMN IF NOT EXISTS seccion_panel VARCHAR(32) NOT NULL DEFAULT 'OPERATIVOS';
ALTER TABLE tareas_campo ADD COLUMN IF NOT EXISTS visible_en_menu_flujo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tareas_campo ADD COLUMN IF NOT EXISTS plantilla_flujo_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tarea_plantilla_flujo'
  ) THEN
    ALTER TABLE tareas_campo
      ADD CONSTRAINT fk_tarea_plantilla_flujo
      FOREIGN KEY (plantilla_flujo_id) REFERENCES tareas_campo(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Pasos del flujo: formulario, rol obligatorio en plantillas nuevas
ALTER TABLE etapas_tarea_campo ADD COLUMN IF NOT EXISTS formulario_id BIGINT;
ALTER TABLE etapas_tarea_campo ADD COLUMN IF NOT EXISTS rol_responsable VARCHAR(50);
ALTER TABLE etapas_tarea_campo ADD COLUMN IF NOT EXISTS respuesta_json VARCHAR(5000);
ALTER TABLE etapas_tarea_campo ADD COLUMN IF NOT EXISTS completada_en TIMESTAMP;
ALTER TABLE etapas_tarea_campo ADD COLUMN IF NOT EXISTS completada_por_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_etapa_formulario') THEN
    ALTER TABLE etapas_tarea_campo
      ADD CONSTRAINT fk_etapa_formulario
      FOREIGN KEY (formulario_id) REFERENCES formularios_dinamicos(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_etapa_completada_por') THEN
    ALTER TABLE etapas_tarea_campo
      ADD CONSTRAINT fk_etapa_completada_por
      FOREIGN KEY (completada_por_id) REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Trazabilidad de respuestas por paso
ALTER TABLE respuestas_formulario ADD COLUMN IF NOT EXISTS etapa_tarea_campo_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_respuesta_etapa_tarea') THEN
    ALTER TABLE respuestas_formulario
      ADD CONSTRAINT fk_respuesta_etapa_tarea
      FOREIGN KEY (etapa_tarea_campo_id) REFERENCES etapas_tarea_campo(id) ON DELETE SET NULL;
  END IF;
END $$;
