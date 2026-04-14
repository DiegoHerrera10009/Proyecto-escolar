package com.susequid.erp.dto;

public class CrearPermisoFlujoPeticion {
    private String titulo;
    private String nombresApellidos;
    private String cedula;
    private String tipoPermiso; // DIAS | HORAS
    private String fechaDesde;
    private String fechaHasta;
    private String horaDesde;
    private String horaHasta;
    private String fechaPermiso;
    private String motivo;
    private String soporteDescripcion;
    private String soporteAdjuntoNombre;
    private String soporteAdjuntoDataUrl;

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getNombresApellidos() {
        return nombresApellidos;
    }

    public void setNombresApellidos(String nombresApellidos) {
        this.nombresApellidos = nombresApellidos;
    }

    public String getCedula() {
        return cedula;
    }

    public void setCedula(String cedula) {
        this.cedula = cedula;
    }

    public String getTipoPermiso() {
        return tipoPermiso;
    }

    public void setTipoPermiso(String tipoPermiso) {
        this.tipoPermiso = tipoPermiso;
    }

    public String getFechaDesde() {
        return fechaDesde;
    }

    public void setFechaDesde(String fechaDesde) {
        this.fechaDesde = fechaDesde;
    }

    public String getFechaHasta() {
        return fechaHasta;
    }

    public void setFechaHasta(String fechaHasta) {
        this.fechaHasta = fechaHasta;
    }

    public String getHoraDesde() {
        return horaDesde;
    }

    public void setHoraDesde(String horaDesde) {
        this.horaDesde = horaDesde;
    }

    public String getHoraHasta() {
        return horaHasta;
    }

    public void setHoraHasta(String horaHasta) {
        this.horaHasta = horaHasta;
    }

    public String getFechaPermiso() {
        return fechaPermiso;
    }

    public void setFechaPermiso(String fechaPermiso) {
        this.fechaPermiso = fechaPermiso;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getSoporteDescripcion() {
        return soporteDescripcion;
    }

    public void setSoporteDescripcion(String soporteDescripcion) {
        this.soporteDescripcion = soporteDescripcion;
    }

    public String getSoporteAdjuntoNombre() {
        return soporteAdjuntoNombre;
    }

    public void setSoporteAdjuntoNombre(String soporteAdjuntoNombre) {
        this.soporteAdjuntoNombre = soporteAdjuntoNombre;
    }

    public String getSoporteAdjuntoDataUrl() {
        return soporteAdjuntoDataUrl;
    }

    public void setSoporteAdjuntoDataUrl(String soporteAdjuntoDataUrl) {
        this.soporteAdjuntoDataUrl = soporteAdjuntoDataUrl;
    }
}
