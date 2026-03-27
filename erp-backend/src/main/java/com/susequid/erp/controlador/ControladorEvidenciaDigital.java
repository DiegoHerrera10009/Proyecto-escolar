package com.susequid.erp.controlador;

import com.susequid.erp.entidad.EvidenciaDigital;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.TareaCampo;
import com.susequid.erp.entidad.TipoEvidencia;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.servicio.ServicioAutorizacion;
import com.susequid.erp.servicio.ServicioEvidenciaDigital;
import com.susequid.erp.servicio.ServicioTareaCampo;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/campo")
public class ControladorEvidenciaDigital {
    private final ServicioEvidenciaDigital servicioEvidencia;
    private final ServicioTareaCampo servicioTarea;
    private final ServicioAutorizacion autorizacion;

    public ControladorEvidenciaDigital(ServicioEvidenciaDigital servicioEvidencia, ServicioTareaCampo servicioTarea, ServicioAutorizacion autorizacion) {
        this.servicioEvidencia = servicioEvidencia;
        this.servicioTarea = servicioTarea;
        this.autorizacion = autorizacion;
    }

    @GetMapping("/tareas/{tareaId}/evidencias")
    public List<EvidenciaDigital> listar(@RequestHeader("Authorization") String auth, @PathVariable Long tareaId) {
        Usuario usuario = autorizacion.requerirUsuario(auth);
        validarAccesoTarea(usuario, tareaId);
        return servicioEvidencia.listarPorTarea(tareaId);
    }

    @PostMapping(path = "/tareas/{tareaId}/evidencias", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EvidenciaDigital subirArchivo(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long tareaId,
            @RequestParam("tipo") TipoEvidencia tipo,
            @RequestPart("archivo") MultipartFile archivo,
            @RequestParam(value = "latitud", required = false) Double latitud,
            @RequestParam(value = "longitud", required = false) Double longitud
    ) {
        Usuario usuario = autorizacion.requerirUsuario(auth);
        validarAccesoTarea(usuario, tareaId);
        return servicioEvidencia.guardarArchivo(tareaId, tipo, archivo, latitud, longitud, usuario);
    }

    @GetMapping("/evidencias/{evidenciaId}/descargar")
    public ResponseEntity<byte[]> descargar(@RequestHeader("Authorization") String auth, @PathVariable Long evidenciaId) {
        Usuario usuario = autorizacion.requerirUsuario(auth);
        EvidenciaDigital evidencia = servicioEvidencia.buscarPorId(evidenciaId);
        validarAccesoTarea(usuario, evidencia.getTarea().getId());

        byte[] contenido = servicioEvidencia.leerContenido(evidencia);
        String nombre = evidencia.getNombreArchivo() == null ? "archivo" : evidencia.getNombreArchivo();
        String nombreCodificado = URLEncoder.encode(nombre, StandardCharsets.UTF_8);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (evidencia.getMimeType() != null && !evidencia.getMimeType().isBlank()) {
            mediaType = MediaType.parseMediaType(evidencia.getMimeType());
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + nombreCodificado)
                .body(contenido);
    }

    private void validarAccesoTarea(Usuario usuario, Long tareaId) {
        boolean esAdmin = usuario.getRoles().stream().anyMatch(r -> r.getNombre() == RolNombre.ADMINISTRADOR);
        if (esAdmin) return;

        TareaCampo tarea = servicioTarea.buscarPorId(tareaId);
        if (tarea.getAsignadoA() == null || !tarea.getAsignadoA().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tiene permisos para ver esta tarea");
        }
    }
}

