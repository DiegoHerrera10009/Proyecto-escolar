-- Evita errores de arranque por truncamiento al forzar varchar(5000)
-- y permite almacenar respuestas JSON grandes.

ALTER TABLE respuestas_formulario
  ALTER COLUMN respuesta_json TYPE TEXT;

ALTER TABLE etapas_tarea_campo
  ALTER COLUMN respuesta_json TYPE TEXT;
