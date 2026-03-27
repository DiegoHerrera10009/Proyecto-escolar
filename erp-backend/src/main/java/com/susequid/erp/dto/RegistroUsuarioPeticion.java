package com.susequid.erp.dto;

import com.susequid.erp.entidad.RolNombre;

import java.util.Set;

public class RegistroUsuarioPeticion {
    private String nombreCompleto;
    private String correo;
    private String clave;
    private Set<RolNombre> roles;

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getClave() {
        return clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }

    public Set<RolNombre> getRoles() {
        return roles;
    }

    public void setRoles(Set<RolNombre> roles) {
        this.roles = roles;
    }
}
