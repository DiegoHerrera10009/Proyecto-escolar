package com.susequid.erp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Cuerpo del POST /api/inventarios/catalogos.
 * {@code columnas} es un array JSON de cadenas (no un string con JSON escapado).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CrearCatalogoInventarioPeticion {
    private String nombre;
    private List<String> columnas;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public List<String> getColumnas() {
        return columnas;
    }

    public void setColumnas(List<String> columnas) {
        this.columnas = columnas;
    }
}
