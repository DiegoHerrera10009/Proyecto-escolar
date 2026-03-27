package com.susequid.erp.dto;

import com.susequid.erp.entidad.EstadoWorkflow;

public class CambioEstadoWorkflowPeticion {
    private EstadoWorkflow estadoNuevo;
    private String comentario;

    public EstadoWorkflow getEstadoNuevo() {
        return estadoNuevo;
    }

    public void setEstadoNuevo(EstadoWorkflow estadoNuevo) {
        this.estadoNuevo = estadoNuevo;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }
}
