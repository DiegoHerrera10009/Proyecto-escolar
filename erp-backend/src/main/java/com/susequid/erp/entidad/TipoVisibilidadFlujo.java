package com.susequid.erp.entidad;

/**
 * Cómo se expone una plantilla publicada.
 */
public enum TipoVisibilidadFlujo {
    /** Aparece en el panel de actividades y puede iniciarse muchas veces. */
    MENU_PERMANENTE,
    /** No aparece en el menú; el admin crea ejecuciones puntuales desde la plantilla. */
    INSTANCIA_UNICA
}
