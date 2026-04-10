package com.susequid.erp.dto;

public class FilaImportarInventario {
    private String codigo;
    private String descripcion;
    private Integer existencias;
    /** Opcional: p. ej. columna «Nombre» en actas de entrega. */
    private String responsable;
    /** Opcional: p. ej. «Área de trabajo», ubicación, sede. */
    private String ubicacion;

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getExistencias() {
        return existencias;
    }

    public void setExistencias(Integer existencias) {
        this.existencias = existencias;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }
}
