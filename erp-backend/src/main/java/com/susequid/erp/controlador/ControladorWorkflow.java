package com.susequid.erp.controlador;

import com.susequid.erp.dto.CambioEstadoWorkflowPeticion;
import com.susequid.erp.entidad.BitacoraWorkflow;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.entidad.WorkflowProceso;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioWorkflow;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
public class ControladorWorkflow {
    private final ServicioWorkflow servicio;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorWorkflow(ServicioWorkflow servicio, ServicioAutorizacion servicioAutorizacion) {
        this.servicio = servicio;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    @GetMapping
    public List<WorkflowProceso> listar(@RequestHeader("Authorization") String autorizacion) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.COMPRAS, RolNombre.BODEGA, RolNombre.HSEQ,
                RolNombre.TECNICO, RolNombre.COMERCIAL, RolNombre.DESPACHO);
        return servicio.listar();
    }

    @PostMapping
    public WorkflowProceso crear(@RequestHeader("Authorization") String autorizacion, @RequestBody WorkflowProceso proceso) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.COMPRAS, RolNombre.ADMINISTRADOR);
        return servicio.guardar(proceso);
    }

    @PutMapping("/{id}/estado")
    public WorkflowProceso cambiarEstado(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @RequestBody CambioEstadoWorkflowPeticion peticion
    ) {
        Usuario usuario = servicioAutorizacion.requerirUsuario(autorizacion);
        return servicio.cambiarEstado(id, peticion.getEstadoNuevo(), peticion.getComentario(), usuario);
    }

    @GetMapping("/{id}/bitacora")
    public List<BitacoraWorkflow> listarBitacora(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id
    ) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.COMPRAS, RolNombre.BODEGA, RolNombre.HSEQ,
                RolNombre.TECNICO, RolNombre.COMERCIAL, RolNombre.DESPACHO);
        return servicio.listarBitacora(id);
    }
}
