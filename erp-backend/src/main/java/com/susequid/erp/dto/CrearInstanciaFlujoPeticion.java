package com.susequid.erp.dto;

/**
 * Ejecución puntual desde plantilla {@link com.susequid.erp.entidad.TipoVisibilidadFlujo#INSTANCIA_UNICA}.
 */
public class CrearInstanciaFlujoPeticion {
    private Long plantillaId;
    private String titulo;
    private Long asignadoAId;

    public Long getPlantillaId() {
        return plantillaId;
    }

    public void setPlantillaId(Long plantillaId) {
        this.plantillaId = plantillaId;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public Long getAsignadoAId() {
        return asignadoAId;
    }

    public void setAsignadoAId(Long asignadoAId) {
        this.asignadoAId = asignadoAId;
    }
}
