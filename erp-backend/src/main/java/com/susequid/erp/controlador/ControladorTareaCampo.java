package com.susequid.erp.controlador;

import com.susequid.erp.dto.CambioEstadoTareaCampoPeticion;
import com.susequid.erp.dto.CrearTareaCampoPeticion;
import com.susequid.erp.dto.AsignarTareaCampoPeticion;
import com.susequid.erp.entidad.*;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioTareaCampo;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campo/tareas")
public class ControladorTareaCampo {
    private final ServicioTareaCampo servicio;
    private final ServicioAutorizacion autorizacion;

    public ControladorTareaCampo(ServicioTareaCampo servicio, ServicioAutorizacion autorizacion) {
        this.servicio = servicio;
        this.autorizacion = autorizacion;
    }

    @GetMapping
    public List<TareaCampo> listar(@RequestHeader("Authorization") String auth) {
        Usuario usuario = autorizacion.requerirUsuario(auth);
        boolean visibilidadGlobal = usuario.getRoles().stream().anyMatch(
                r -> r.getNombre() == RolNombre.ADMINISTRADOR || r.getNombre() == RolNombre.SUPERVISOR
        );
        if (visibilidadGlobal) {
            return servicio.listarTodas();
        }
        return servicio.listarPorAsignado(usuario.getId());
    }

    @GetMapping("/{id}")
    public TareaCampo buscar(@RequestHeader("Authorization") String auth, @PathVariable Long id) {
        autorizacion.requerirUsuario(auth);
        return servicio.buscarPorId(id);
    }

    @PostMapping
    public TareaCampo crear(@RequestHeader("Authorization") String auth, @RequestBody CrearTareaCampoPeticion peticion) {
        Usuario usuario = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicio.crear(peticion, usuario);
    }

    @PutMapping("/{id}/estado")
    public TareaCampo cambiarEstado(@RequestHeader("Authorization") String auth, @PathVariable Long id, @RequestBody CambioEstadoTareaCampoPeticion peticion) {
        Usuario usuario = autorizacion.requerirUsuario(auth);
        return servicio.cambiarEstado(id, peticion, usuario);
    }

    @PutMapping("/{id}/asignacion")
    public TareaCampo asignar(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestBody AsignarTareaCampoPeticion peticion
    ) {
        autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicio.asignarTarea(id, peticion);
    }

    @GetMapping("/{id}/historial")
    public List<HistorialTareaCampo> historial(@RequestHeader("Authorization") String auth, @PathVariable Long id) {
        autorizacion.requerirUsuario(auth);
        return servicio.listarHistorial(id);
    }

    @GetMapping("/{id}/etapas")
    public List<EtapaTareaCampo> etapas(@RequestHeader("Authorization") String auth, @PathVariable Long id) {
        autorizacion.requerirUsuario(auth);
        return servicio.listarEtapas(id);
    }
}

