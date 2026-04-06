package com.susequid.erp.dto;

public class PasoFlujoDefPeticion {
    private String nombre;
    private Integer orden;
    /** TECNICO, SUPERVISOR, etc. (RolNombre.name()) */
    private String rolResponsable;
    private Long formularioId;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public String getRolResponsable() {
        return rolResponsable;
    }

    public void setRolResponsable(String rolResponsable) {
        this.rolResponsable = rolResponsable;
    }

    public Long getFormularioId() {
        return formularioId;
    }

    public void setFormularioId(Long formularioId) {
        this.formularioId = formularioId;
    }
}
