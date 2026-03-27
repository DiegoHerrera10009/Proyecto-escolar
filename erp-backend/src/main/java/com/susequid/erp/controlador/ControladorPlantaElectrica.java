package com.susequid.erp.controlador;

import com.susequid.erp.entidad.PlantaElectrica;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioPlantaElectrica;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plantas")
public class ControladorPlantaElectrica {
    private final ServicioPlantaElectrica servicio;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorPlantaElectrica(ServicioPlantaElectrica servicio, ServicioAutorizacion servicioAutorizacion) {
        this.servicio = servicio;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    @GetMapping
    public List<PlantaElectrica> listar(@RequestHeader("Authorization") String autorizacion) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.TECNICO, RolNombre.HSEQ, RolNombre.BODEGA, RolNombre.COMPRAS);
        return servicio.listar();
    }

    @GetMapping("/{id}")
    public PlantaElectrica buscar(@RequestHeader("Authorization") String autorizacion, @PathVariable Long id) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.TECNICO, RolNombre.HSEQ, RolNombre.BODEGA, RolNombre.COMPRAS);
        return servicio.buscarPorId(id);
    }

    @PostMapping
    public PlantaElectrica crear(@RequestHeader("Authorization") String autorizacion, @RequestBody PlantaElectrica planta) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.TECNICO, RolNombre.BODEGA);
        return servicio.guardar(planta);
    }

    @PutMapping("/{id}")
    public PlantaElectrica actualizar(@RequestHeader("Authorization") String autorizacion, @PathVariable Long id, @RequestBody PlantaElectrica planta) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.TECNICO, RolNombre.HSEQ);
        PlantaElectrica existente = servicio.buscarPorId(id);
        existente.setNombre(planta.getNombre());
        existente.setSerial(planta.getSerial());
        existente.setUbicacion(planta.getUbicacion());
        existente.setEstado(planta.getEstado());
        existente.setTecnicoAsignado(planta.getTecnicoAsignado());
        return servicio.guardar(existente);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@RequestHeader("Authorization") String autorizacion, @PathVariable Long id) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        servicio.eliminar(id);
    }
}
