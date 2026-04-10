package com.susequid.erp.dto;

import java.util.ArrayList;
import java.util.List;

public class ImportarInventarioPeticion {
    private List<FilaImportarInventario> filas = new ArrayList<>();

    public List<FilaImportarInventario> getFilas() {
        return filas;
    }

    public void setFilas(List<FilaImportarInventario> filas) {
        this.filas = filas != null ? filas : new ArrayList<>();
    }
}
