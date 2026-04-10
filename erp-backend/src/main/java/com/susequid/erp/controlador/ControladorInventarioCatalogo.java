package com.susequid.erp.controlador;

import com.susequid.erp.dto.CrearCatalogoInventarioPeticion;
import com.susequid.erp.dto.EliminarCatalogoInventarioPeticion;
import com.susequid.erp.dto.ImportarInventarioPeticion;
import com.susequid.erp.dto.ImportarInventarioResultado;
import com.susequid.erp.entidad.InventarioItem;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioInventarioCatalogo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventarios/catalogos")
public class ControladorInventarioCatalogo {
    private final ServicioInventarioCatalogo servicio;
    private final ServicioAutorizacion servicioAutorizacion;

    public ControladorInventarioCatalogo(ServicioInventarioCatalogo servicio, ServicioAutorizacion servicioAutorizacion) {
        this.servicio = servicio;
        this.servicioAutorizacion = servicioAutorizacion;
    }

    private static ResponseEntity<Map<String, String>> error(String mensaje, HttpStatus status) {
        return ResponseEntity.status(status).body(Map.of("mensaje", mensaje));
    }

    @GetMapping
    public ResponseEntity<?> listarCatalogos(@RequestHeader("Authorization") String autorizacion) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.BODEGA, RolNombre.COMPRAS, RolNombre.TECNICO, RolNombre.HSEQ);
            return ResponseEntity.ok(servicio.listarCatalogos());
        } catch (RuntimeException e) {
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping
    public ResponseEntity<?> crearCatalogo(
            @RequestHeader("Authorization") String autorizacion,
            @RequestBody CrearCatalogoInventarioPeticion cuerpo
    ) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.BODEGA, RolNombre.COMPRAS);
            String nombre = cuerpo != null && cuerpo.getNombre() != null ? cuerpo.getNombre().trim() : null;
            List<String> columnas = cuerpo != null ? cuerpo.getColumnas() : null;
            return ResponseEntity.ok(servicio.crearCatalogo(nombre, columnas));
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    /**
     * Borrado con contraseña en el cuerpo (no en cabecera): evita que CORS/proxies pierdan la confirmación.
     */
    @PostMapping("/{id}/eliminar")
    public ResponseEntity<?> eliminarCatalogo(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long id,
            @RequestParam(value = "forzar", defaultValue = "false") boolean forzar,
            @RequestBody(required = false) EliminarCatalogoInventarioPeticion cuerpo
    ) {
        try {
            Usuario admin = servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
            String clave = cuerpo != null ? cuerpo.getClaveConfirmacion() : null;
            servicioAutorizacion.verificarClaveUsuario(admin, clave);
            servicio.eliminarCatalogo(id, forzar);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{catalogoId}/items")
    public ResponseEntity<?> listarItems(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long catalogoId
    ) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.BODEGA, RolNombre.COMPRAS, RolNombre.TECNICO, RolNombre.HSEQ);
            return ResponseEntity.ok(servicio.listarItems(catalogoId));
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.NOT_FOUND);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping("/{catalogoId}/items")
    public ResponseEntity<?> crearItem(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long catalogoId,
            @RequestBody InventarioItem datos
    ) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.BODEGA, RolNombre.COMPRAS);
            return ResponseEntity.ok(servicio.crearItem(catalogoId, datos));
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    /** Dos segmentos después del id del catálogo para no chocar con {@code /{catalogoId}/items}. */
    @PostMapping("/{catalogoId}/acciones/importar")
    public ResponseEntity<?> importarItems(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long catalogoId,
            @RequestBody ImportarInventarioPeticion peticion
    ) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.BODEGA, RolNombre.COMPRAS);
            ImportarInventarioResultado r = servicio.importarItemsDesdeFilas(
                    catalogoId,
                    peticion != null ? peticion.getFilas() : List.of()
            );
            return ResponseEntity.ok(r);
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> actualizarItem(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long itemId,
            @RequestBody InventarioItem datos
    ) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR, RolNombre.SUPERVISOR, RolNombre.BODEGA, RolNombre.HSEQ);
            return ResponseEntity.ok(servicio.actualizarItem(itemId, datos));
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> eliminarItem(
            @RequestHeader("Authorization") String autorizacion,
            @PathVariable Long itemId
    ) {
        try {
            servicioAutorizacion.requerirRol(autorizacion, RolNombre.ADMINISTRADOR);
            servicio.eliminarItem(itemId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e instanceof IllegalArgumentException) {
                return error(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
            return error(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}
