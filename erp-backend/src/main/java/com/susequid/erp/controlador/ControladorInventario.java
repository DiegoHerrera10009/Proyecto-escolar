package com.susequid.erp.controlador;

import com.susequid.erp.entidad.EquipoInventario;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioInventario;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
public class ControladorInventario {
    private final ServicioInventario servicio;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorInventario(ServicioInventario servicio, ServicioAutorizacion servicioAutorizacion) {
        this.servicio = servicio;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    @GetMapping
    public List<EquipoInventario> listar(@RequestHeader("Authorization") String autorizacion) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.BODEGA, RolNombre.COMPRAS, RolNombre.TECNICO);
        return servicio.listar();
    }

    @PostMapping
    public EquipoInventario crear(@RequestHeader("Authorization") String autorizacion, @RequestBody EquipoInventario equipo) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.BODEGA, RolNombre.COMPRAS);
        return servicio.guardar(equipo);
    }

    @PutMapping("/{id}")
    public EquipoInventario actualizar(@RequestHeader("Authorization") String autorizacion, @PathVariable Long id, @RequestBody EquipoInventario equipo) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.BODEGA, RolNombre.HSEQ);
        equipo.setId(id);
        return servicio.guardar(equipo);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@RequestHeader("Authorization") String autorizacion, @PathVariable Long id) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        servicio.eliminar(id);
    }
}
