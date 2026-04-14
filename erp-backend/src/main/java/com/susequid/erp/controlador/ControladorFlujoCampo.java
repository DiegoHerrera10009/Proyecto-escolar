package com.susequid.erp.controlador;

import com.susequid.erp.dto.CompletarPasoFlujoPeticion;
import com.susequid.erp.dto.CrearInstanciaFlujoPeticion;
import com.susequid.erp.dto.CrearPermisoFlujoPeticion;
import com.susequid.erp.dto.CrearPedidoFlujoPeticion;
import com.susequid.erp.dto.CrearPlantillaFlujoPeticion;
import com.susequid.erp.dto.ParseoPedidoPdfRespuesta;
import com.susequid.erp.entidad.EstadoTareaCampo;
import com.susequid.erp.entidad.EtapaTareaCampo;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.TareaCampo;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioFlujoCampo;
import com.susequid.erp.servicio.ServicioParseoPedidoPdf;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/campo/flujos")
public class ControladorFlujoCampo {
    private final ServicioFlujoCampo servicioFlujo;
    private final ServicioAutorizacion autorizacion;
    private final ServicioParseoPedidoPdf servicioParseoPedidoPdf;

    public ControladorFlujoCampo(
            ServicioFlujoCampo servicioFlujo,
            ServicioAutorizacion autorizacion,
            ServicioParseoPedidoPdf servicioParseoPedidoPdf
    ) {
        this.servicioFlujo = servicioFlujo;
        this.autorizacion = autorizacion;
        this.servicioParseoPedidoPdf = servicioParseoPedidoPdf;
    }

    // ===== PLANTILLAS (admin) =====

    @PostMapping("/plantillas")
    public TareaCampo crearPlantilla(
            @RequestHeader("Authorization") String auth,
            @RequestBody CrearPlantillaFlujoPeticion peticion
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicioFlujo.crearPlantilla(peticion, admin);
    }

    @PutMapping("/plantillas/{id}")
    public TareaCampo editarPlantilla(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestBody CrearPlantillaFlujoPeticion peticion
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicioFlujo.editarPlantilla(id, peticion, admin);
    }

    @GetMapping("/plantillas")
    public List<TareaCampo> listarPlantillas(
            @RequestHeader("Authorization") String auth,
            @RequestParam("estado") String estado
    ) {
        autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        EstadoTareaCampo e = EstadoTareaCampo.valueOf(estado.trim().toUpperCase());
        return servicioFlujo.listarPlantillas(e);
    }

    @GetMapping("/plantillas/{id}/pasos")
    public List<EtapaTareaCampo> pasosPlantilla(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id
    ) {
        autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicioFlujo.obtenerPasosPlantilla(id);
    }

    @PutMapping("/plantillas/{id}/publicar")
    public TareaCampo publicar(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicioFlujo.publicarPlantilla(id, admin);
    }

    @PutMapping("/plantillas/{id}/despublicar")
    public TareaCampo despublicar(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicioFlujo.despublicarPlantilla(id, admin);
    }

    @DeleteMapping("/plantillas/{id}")
    public void eliminarPlantilla(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestParam(value = "forzar", defaultValue = "false") boolean forzar
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        servicioFlujo.eliminarPlantilla(id, admin, forzar);
    }

    // ===== MENÚ (todos los roles con acceso) =====

    @GetMapping("/menu")
    public List<TareaCampo> menu(
            @RequestHeader("Authorization") String auth,
            @RequestParam(value = "seccion", required = false) String seccion
    ) {
        Usuario u = autorizacion.requerirUsuario(auth);
        return servicioFlujo.listarPlantillasMenu(seccion, u);
    }

    @PostMapping("/plantillas/{id}/iniciar")
    public TareaCampo iniciarDesdeMenu(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id
    ) {
        Usuario u = autorizacion.requerirUsuario(auth);
        return servicioFlujo.iniciarEjecucionDesdeMenu(id, u);
    }

    /** Debe ir antes de {@code /pedidos} para que la ruta más específica se resuelva sin ambigüedad. */
    @PostMapping("/pedidos/parsear-pdf")
    public ParseoPedidoPdfRespuesta parsearPdfPedido(
            @RequestHeader("Authorization") String auth,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        autorizacion.requerirRol(auth, RolNombre.COMERCIAL, RolNombre.ADMINISTRADOR);
        return servicioParseoPedidoPdf.parsear(archivo);
    }

    @PostMapping("/pedidos")
    public TareaCampo iniciarFlujoPedido(
            @RequestHeader("Authorization") String auth,
            @RequestBody CrearPedidoFlujoPeticion peticion
    ) {
        Usuario comercial = autorizacion.requerirRol(auth, RolNombre.COMERCIAL, RolNombre.ADMINISTRADOR);
        return servicioFlujo.iniciarFlujoPedido(peticion, comercial);
    }

    @PostMapping("/permisos")
    public TareaCampo iniciarFlujoPermiso(
            @RequestHeader("Authorization") String auth,
            @RequestBody CrearPermisoFlujoPeticion peticion
    ) {
        Usuario solicitante = autorizacion.requerirUsuario(auth);
        return servicioFlujo.iniciarFlujoPermiso(peticion, solicitante);
    }

    @PostMapping("/preoperacionales")
    public TareaCampo iniciarFlujoPreoperacionalVehiculo(
            @RequestHeader("Authorization") String auth
    ) {
        Usuario tecnico = autorizacion.requerirRol(auth, RolNombre.TECNICO);
        return servicioFlujo.iniciarFlujoPreoperacionalVehiculo(tecnico);
    }

    // ===== INSTANCIAS ÚNICAS (admin) =====

    @PostMapping("/instancias")
    public TareaCampo crearInstancia(
            @RequestHeader("Authorization") String auth,
            @RequestBody CrearInstanciaFlujoPeticion peticion
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        return servicioFlujo.crearInstanciaDesdePlantilla(peticion, admin);
    }

    // ===== MIS ACTIVIDADES (cualquier usuario autenticado) =====

    @GetMapping("/mis-actividades/activas")
    public List<TareaCampo> misActivas(@RequestHeader("Authorization") String auth) {
        Usuario u = autorizacion.requerirUsuario(auth);
        return servicioFlujo.listarMisActividadesActivas(u);
    }

    @GetMapping("/mis-actividades/seguimiento")
    public List<TareaCampo> misSeguimiento(@RequestHeader("Authorization") String auth) {
        Usuario u = autorizacion.requerirUsuario(auth);
        return servicioFlujo.listarMisFlujosSoloSeguimiento(u);
    }

    @GetMapping("/mis-actividades/historial")
    public List<TareaCampo> misHistorial(@RequestHeader("Authorization") String auth) {
        Usuario u = autorizacion.requerirUsuario(auth);
        return servicioFlujo.listarMisActividadesHistorial(u);
    }

    // ===== EJECUCIONES — paso activo y completar =====

    @GetMapping("/ejecuciones/{tareaId}/paso-activo")
    public EtapaTareaCampo pasoActivo(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long tareaId
    ) {
        autorizacion.requerirUsuario(auth);
        return servicioFlujo.obtenerPasoActivo(tareaId);
    }

    @PostMapping("/ejecuciones/{tareaId}/pasos/{etapaId}/completar")
    public TareaCampo completarPaso(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long tareaId,
            @PathVariable Long etapaId,
            @RequestBody(required = false) CompletarPasoFlujoPeticion peticion
    ) {
        Usuario u = autorizacion.requerirUsuario(auth);
        CompletarPasoFlujoPeticion body = peticion != null ? peticion : new CompletarPasoFlujoPeticion();
        return servicioFlujo.completarPaso(tareaId, etapaId, body, u);
    }

    @PostMapping("/ejecuciones/{tareaId}/cancelar")
    public TareaCampo cancelarEjecucionPorCreador(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long tareaId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        Usuario u = autorizacion.requerirUsuario(auth);
        String motivo = body != null ? body.get("motivo") : null;
        return servicioFlujo.cancelarEjecucionPorCreador(tareaId, u, motivo);
    }

    // ===== ADMIN — monitoreo y control de ejecuciones =====

    @GetMapping("/admin/ejecuciones")
    public List<TareaCampo> listarEjecucionesAdmin(
            @RequestHeader("Authorization") String auth,
            @RequestParam(value = "estado", required = false) String estado
    ) {
        autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        EstadoTareaCampo filtro = null;
        if (estado != null && !estado.isBlank()) {
            filtro = EstadoTareaCampo.valueOf(estado.trim().toUpperCase());
        }
        return servicioFlujo.listarEjecucionesAdmin(filtro);
    }

    @PutMapping("/admin/ejecuciones/{tareaId}/estado")
    public TareaCampo cambiarEstadoEjecucionAdmin(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long tareaId,
            @RequestBody Map<String, String> body
    ) {
        Usuario admin = autorizacion.requerirRol(auth, RolNombre.ADMINISTRADOR);
        String nuevoEstadoStr = body.get("estadoNuevo");
        String motivo = body.get("motivo");
        if (nuevoEstadoStr == null || nuevoEstadoStr.isBlank()) {
            throw new RuntimeException("Debe indicar estadoNuevo");
        }
        EstadoTareaCampo nuevoEstado = EstadoTareaCampo.valueOf(nuevoEstadoStr.trim().toUpperCase());
        return servicioFlujo.cambiarEstadoEjecucionAdmin(tareaId, nuevoEstado, motivo, admin);
    }
}
