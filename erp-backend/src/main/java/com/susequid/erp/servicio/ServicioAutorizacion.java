package com.susequid.erp.servicio;

import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ServicioAutorizacion {
    public static final String CORREO_SUPER_ADMIN = "admin@susequid.com";
    private final ServicioAutenticacion servicioAutenticacion;

    public ServicioAutorizacion(ServicioAutenticacion servicioAutenticacion) {
        this.servicioAutenticacion = servicioAutenticacion;
    }

    public Usuario requerirUsuario(String cabeceraAutorizacion) {
        String token = extraerToken(cabeceraAutorizacion);
        return servicioAutenticacion.obtenerUsuarioPorToken(token)
                .orElseThrow(() -> new RuntimeException("Token invalido o sesion expirada"));
    }

    public Usuario requerirRol(String cabeceraAutorizacion, RolNombre... rolesPermitidos) {
        Usuario usuario = requerirUsuario(cabeceraAutorizacion);
        Set<RolNombre> rolesUsuario = usuario.getRoles().stream().map(r -> r.getNombre()).collect(Collectors.toSet());
        boolean permitido = rolesUsuario.contains(RolNombre.ADMINISTRADOR)
                || Arrays.stream(rolesPermitidos).anyMatch(rolesUsuario::contains);
        if (!permitido) {
            throw new RuntimeException("No tiene permisos para esta accion");
        }
        return usuario;
    }

    public Usuario requerirSuperAdmin(String cabeceraAutorizacion) {
        Usuario usuario = requerirRol(cabeceraAutorizacion, RolNombre.ADMINISTRADOR);
        if (!CORREO_SUPER_ADMIN.equalsIgnoreCase(usuario.getCorreo())) {
            throw new RuntimeException("Solo el super admin puede realizar esta accion");
        }
        return usuario;
    }

    private String extraerToken(String cabeceraAutorizacion) {
        if (cabeceraAutorizacion == null || !cabeceraAutorizacion.startsWith("Bearer ")) {
            throw new RuntimeException("Debe enviar Authorization: Bearer <token>");
        }
        return cabeceraAutorizacion.substring(7).trim();
    }
}
