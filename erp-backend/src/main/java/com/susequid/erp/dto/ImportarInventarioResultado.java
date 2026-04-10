package com.susequid.erp.dto;

import java.util.ArrayList;
import java.util.List;

public class ImportarInventarioResultado {
    private int creados;
    private int actualizados;
    private int ignorados;
    private List<String> errores = new ArrayList<>();

    public int getCreados() {
        return creados;
    }

    public void setCreados(int creados) {
        this.creados = creados;
    }

    public int getActualizados() {
        return actualizados;
    }

    public void setActualizados(int actualizados) {
        this.actualizados = actualizados;
    }

    public int getIgnorados() {
        return ignorados;
    }

    public void setIgnorados(int ignorados) {
        this.ignorados = ignorados;
    }

    public List<String> getErrores() {
        return errores;
    }

    public void setErrores(List<String> errores) {
        this.errores = errores != null ? errores : new ArrayList<>();
    }
}
