package com.susequid.erp.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CrearTareaCampoPeticion {
    private String titulo;
    private String descripcion;
    private Long asignadoAId;
    private Long formularioId;
    private Long plantaId;
    private Long equipoId;
    private Double latitud;
    private Double longitud;
    private LocalDateTime fechaVencimiento;
    private List<String> etapas;

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Long getAsignadoAId() {
        return asignadoAId;
    }

    public void setAsignadoAId(Long asignadoAId) {
        this.asignadoAId = asignadoAId;
    }

    public Long getFormularioId() {
        return formularioId;
    }

    public void setFormularioId(Long formularioId) {
        this.formularioId = formularioId;
    }

    public Long getPlantaId() {
        return plantaId;
    }

    public void setPlantaId(Long plantaId) {
        this.plantaId = plantaId;
    }

    public Long getEquipoId() {
        return equipoId;
    }

    public void setEquipoId(Long equipoId) {
        this.equipoId = equipoId;
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

    public LocalDateTime getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDateTime fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public List<String> getEtapas() {
        return etapas;
    }

    public void setEtapas(List<String> etapas) {
        this.etapas = etapas;
    }
}

