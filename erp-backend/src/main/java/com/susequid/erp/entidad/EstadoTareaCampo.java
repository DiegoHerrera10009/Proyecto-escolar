package com.susequid.erp.entidad;

public enum EstadoTareaCampo {
    /** Plantilla de flujo en edición (solo admin). */
    BORRADOR,
    /** Plantilla publicada y disponible para menú o instancias (solo admin gestiona). */
    PUBLICADA,
    PENDIENTE,
    EN_PROCESO,
    PENDIENTE_APROBACION,
    TERMINADA,
    CANCELADA
}

