package com.susequid.erp.controlador;

import com.susequid.erp.dto.CambioRolUsuarioPeticion;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioUsuario;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        servicioAutorizacion.requerirSuperAdmin(autorizacion);
        return servicioUsuario.listarTodos();
    }

    @PutMapping("/{id}/rol")
    public Usuario actualizarRol(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @RequestBody CambioRolUsuarioPeticion peticion
    ) {
        servicioAutorizacion.requerirSuperAdmin(autorizacion);
        return servicioUsuario.actualizarRol(id, peticion.getRol());
    }

    @DeleteMapping("/{id}")
    public void eliminar(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id
    ) {
        servicioAutorizacion.requerirSuperAdmin(autorizacion);
        servicioUsuario.eliminar(id);
    }
}

