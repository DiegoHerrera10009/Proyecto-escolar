package com.susequid.erp.dto;

public class LineaPedidoPdfDto {
    private String referencia;
    private String descripcion;

    public LineaPedidoPdfDto() {
    }

    public LineaPedidoPdfDto(String referencia, String descripcion) {
        this.referencia = referencia;
        this.descripcion = descripcion;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    /** Formato unificado para el flujo: "ref | descripción". */
    public String aTextoProducto() {
        String r = referencia != null ? referencia.trim() : "";
        String d = descripcion != null ? descripcion.trim() : "";
        return (r + " | " + d).trim();
    }
}
