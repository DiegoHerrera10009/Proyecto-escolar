package com.susequid.erp.dto;

import com.susequid.erp.entidad.SeccionPanelFlujo;
import com.susequid.erp.entidad.TipoVisibilidadFlujo;

import java.util.List;

public class CrearPlantillaFlujoPeticion {
    private String titulo;
    private String descripcion;
    private TipoVisibilidadFlujo tipoVisibilidad;
    private SeccionPanelFlujo seccionPanel;
    private Boolean visibleEnMenuFlujo;
    /** Rol que verá el flujo en «Disponibles» e iniciará (debe coincidir con el primer paso al publicar). */
    private String menuInicioRol;
    private List<PasoFlujoDefPeticion> pasos;

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

    public TipoVisibilidadFlujo getTipoVisibilidad() {
        return tipoVisibilidad;
    }

    public void setTipoVisibilidad(TipoVisibilidadFlujo tipoVisibilidad) {
        this.tipoVisibilidad = tipoVisibilidad;
    }

    public SeccionPanelFlujo getSeccionPanel() {
        return seccionPanel;
    }

    public void setSeccionPanel(SeccionPanelFlujo seccionPanel) {
        this.seccionPanel = seccionPanel;
    }

    public Boolean getVisibleEnMenuFlujo() {
        return visibleEnMenuFlujo;
    }

    public void setVisibleEnMenuFlujo(Boolean visibleEnMenuFlujo) {
        this.visibleEnMenuFlujo = visibleEnMenuFlujo;
    }

    public List<PasoFlujoDefPeticion> getPasos() {
        return pasos;
    }

    public void setPasos(List<PasoFlujoDefPeticion> pasos) {
        this.pasos = pasos;
    }

    public String getMenuInicioRol() {
        return menuInicioRol;
    }

    public void setMenuInicioRol(String menuInicioRol) {
        this.menuInicioRol = menuInicioRol;
    }
}
