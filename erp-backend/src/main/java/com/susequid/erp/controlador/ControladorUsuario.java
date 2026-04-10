package com.susequid.erp.controlador;

import com.susequid.erp.dto.CambioRolUsuarioPeticion;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioUsuario;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/usuarios")
public class ControladorUsuario {
    private final ServicioUsuario servicioUsuario;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorUsuario(ServicioUsuario servicioUsuario, ServicioAutorizacion servicioAutorizacion) {
        this.servicioUsuario = servicioUsuario;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    @GetMapping
    public List<Usuario> listar(@RequestHeader("Authorization") String autorizacion) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        return servicioUsuario.listarTodos();
    }

    @PutMapping("/{id}/rol")
    public Usuario actualizarRol(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @RequestBody CambioRolUsuarioPeticion peticion
    ) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        if (peticion == null || peticion.getRol() == null || peticion.getRol().isBlank()) {
            throw new RuntimeException("Debe indicar un rol");
        }
        RolNombre rol;
        try {
            rol = RolNombre.valueOf(peticion.getRol().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Rol no valido: " + peticion.getRol());
        }
        return servicioUsuario.actualizarRol(id, rol);
    }

    @PutMapping("/{id}/rol/{rol}")
    public Usuario actualizarRolPorRuta(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @PathVariable String rol
    ) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        if (rol == null || rol.isBlank()) {
            throw new RuntimeException("Debe indicar un rol");
        }
        RolNombre rolNormalizado;
        try {
            rolNormalizado = RolNombre.valueOf(rol.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Rol no valido: " + rol);
        }
        return servicioUsuario.actualizarRol(id, rolNormalizado);
    }

    @DeleteMapping("/{id}")
    public void eliminar(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id
    ) {
        Usuario admin = servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        servicioUsuario.eliminar(id, admin);
    }
}

