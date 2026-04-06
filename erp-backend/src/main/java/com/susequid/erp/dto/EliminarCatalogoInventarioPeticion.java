package com.susequid.erp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EliminarCatalogoInventarioPeticion {
    /** Clave actual del usuario (misma que en el login). */
    private String claveConfirmacion;

    public String getClaveConfirmacion() {
        return claveConfirmacion;
    }

    public void setClaveConfirmacion(String claveConfirmacion) {
        this.claveConfirmacion = claveConfirmacion;
    }
}
