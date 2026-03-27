package com.susequid.erp.dto;

import com.susequid.erp.entidad.EstadoTareaCampo;

public class CambioEstadoTareaCampoPeticion {
    private EstadoTareaCampo estadoNuevo;
    private String comentario;
    private Double latitud;
    private Double longitud;

    public EstadoTareaCampo getEstadoNuevo() {
        return estadoNuevo;
    }

    public void setEstadoNuevo(EstadoTareaCampo estadoNuevo) {
        this.estadoNuevo = estadoNuevo;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }
}

