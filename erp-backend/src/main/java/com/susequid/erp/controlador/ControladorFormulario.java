package com.susequid.erp.controlador;

import com.susequid.erp.entidad.FormularioDinamico;
import com.susequid.erp.entidad.RespuestaFormulario;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioFormulario;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/formularios")
public class ControladorFormulario {
    private final ServicioFormulario servicio;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorFormulario(ServicioFormulario servicio, ServicioAutorizacion servicioAutorizacion) {
        this.servicio = servicio;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    @GetMapping
    public List<FormularioDinamico> listarFormularios(@RequestHeader("Authorization") String autorizacion) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.BODEGA,
                RolNombre.COMPRAS, RolNombre.COMERCIAL);
        return servicio.listarFormularios();
    }

    @PostMapping
    public FormularioDinamico crearFormulario(@RequestHeader("Authorization") String autorizacion, @RequestBody FormularioDinamico formulario) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        return servicio.guardarFormulario(formulario);
    }

    @PutMapping("/{id}")
    public FormularioDinamico actualizarFormulario(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @RequestBody FormularioDinamico formulario
    ) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        return servicio.actualizarFormulario(id, formulario);
    }

    @GetMapping("/respuestas")
    public List<RespuestaFormulario> listarRespuestas(@RequestHeader("Authorization") String autorizacion) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.BODEGA,
                RolNombre.COMPRAS, RolNombre.COMERCIAL);
        return servicio.listarRespuestas();
    }

    @PostMapping("/respuestas")
    public RespuestaFormulario guardarRespuesta(@RequestHeader("Authorization") String autorizacion, @RequestBody RespuestaFormulario respuesta) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.BODEGA,
                RolNombre.COMPRAS, RolNombre.COMERCIAL);
        return servicio.guardarRespuesta(respuesta);
    }

    @DeleteMapping("/{id}")
    public void eliminarFormulario(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @RequestParam(value = "forzar", defaultValue = "false") boolean forzar
    ) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        servicio.eliminarFormulario(id, forzar);
    }

    @DeleteMapping("/respuestas/{id}")
    public void eliminarRespuesta(@RequestHeader("Authorization") String autorizacion, @PathVariable Long id) {
        servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
        servicio.eliminarRespuesta(id);
    }
}
