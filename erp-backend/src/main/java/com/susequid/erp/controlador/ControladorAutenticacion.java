package com.susequid.erp.controlador;

import com.susequid.erp.dto.LoginPeticion;
import com.susequid.erp.dto.LoginRespuesta;
import com.susequid.erp.dto.RegistroUsuarioPeticion;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.servicio.ServicioAutenticacion;
import com.susequid.erp.servicio.ServicioAutorizacion;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class ControladorAutenticacion {
    private final ServicioAutenticacion servicioAutenticacion;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorAutenticacion(ServicioAutenticacion servicioAutenticacion, ServicioAutorizacion servicioAutorizacion) {
        this.servicioAutenticacion = servicioAutenticacion;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    @PostMapping("/registro")
    public Usuario registrar(
            @RequestHeader("Authorization") String autorizacion,
            @RequestBody RegistroUsuarioPeticion peticion
    ) {
        servicioAutorizacion.requerirSuperAdmin(autorizacion);
        return servicioAutenticacion.registrar(peticion);
    }

    @PostMapping("/login")
    public LoginRespuesta login(@RequestBody LoginPeticion peticion) {
        return servicioAutenticacion.login(peticion);
    }
}
