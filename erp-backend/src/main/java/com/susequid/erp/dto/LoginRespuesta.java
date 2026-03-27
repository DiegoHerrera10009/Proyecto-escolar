package com.susequid.erp.dto;

import java.util.Set;

public class LoginRespuesta {
    private String token;
    private Long usuarioId;
    private String correo;
    private Set<String> roles;

    public LoginRespuesta(String token, Long usuarioId, String correo, Set<String> roles) {
        this.token = token;
        this.usuarioId = usuarioId;
        this.correo = correo;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getCorreo() {
        return correo;
    }

    public Set<String> getRoles() {
        return roles;
    }
}
