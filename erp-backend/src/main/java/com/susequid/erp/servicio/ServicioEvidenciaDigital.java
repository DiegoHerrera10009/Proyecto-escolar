package com.susequid.erp.servicio;

import com.susequid.erp.entidad.EvidenciaDigital;
import com.susequid.erp.entidad.TareaCampo;
import com.susequid.erp.entidad.TipoEvidencia;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.repositorio.EvidenciaDigitalRepositorio;
import com.susequid.erp.repositorio.TareaCampoRepositorio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class ServicioEvidenciaDigital {
    private final EvidenciaDigitalRepositorio evidenciaRepositorio;
    private final TareaCampoRepositorio tareaRepositorio;
    private final Path rutaBase;

    public ServicioEvidenciaDigital(
            EvidenciaDigitalRepositorio evidenciaRepositorio,
            TareaCampoRepositorio tareaRepositorio,
            @Value("${app.almacenamiento.rutaBase:./almacenamiento}") String rutaBase
    ) {
        this.evidenciaRepositorio = evidenciaRepositorio;
        this.tareaRepositorio = tareaRepositorio;
        this.rutaBase = Paths.get(rutaBase).toAbsolutePath().normalize();
    }

    public List<EvidenciaDigital> listarPorTarea(Long tareaId) {
        return evidenciaRepositorio.findByTarea_IdOrderByFechaRegistroDesc(tareaId);
    }

    public EvidenciaDigital guardarArchivo(Long tareaId, TipoEvidencia tipo, MultipartFile archivo, Double latitud, Double longitud, Usuario usuario) {
        if (archivo == null || archivo.isEmpty()) {
            throw new RuntimeException("Debe adjuntar un archivo");
        }
        TareaCampo tarea = tareaRepositorio.findById(tareaId).orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

        String original = archivo.getOriginalFilename() == null ? "archivo" : archivo.getOriginalFilename();
        String extension = "";
        int idx = original.lastIndexOf('.');
        if (idx > -1 && idx < original.length() - 1) {
            extension = original.substring(idx);
        }

        String selloTiempo = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String nombreSeguro = tipo.name().toLowerCase() + "_" + selloTiempo + "_" + UUID.randomUUID() + extension;
        Path carpetaTarea = rutaBase.resolve("tareas").resolve(String.valueOf(tareaId)).resolve("evidencias");

        try {
            Files.createDirectories(carpetaTarea);
            Path destino = carpetaTarea.resolve(nombreSeguro);
            Files.copy(archivo.getInputStream(), destino);

            EvidenciaDigital evidencia = new EvidenciaDigital();
            evidencia.setTarea(tarea);
            evidencia.setTipo(tipo);
            evidencia.setNombreArchivo(original);
            evidencia.setRutaArchivo(destino.toString());
            evidencia.setMimeType(archivo.getContentType());
            evidencia.setTamanoBytes(archivo.getSize());
            evidencia.setLatitud(latitud);
            evidencia.setLongitud(longitud);
            evidencia.setUsuario(usuario);
            return evidenciaRepositorio.save(evidencia);
        } catch (IOException e) {
            throw new RuntimeException("No fue posible guardar el archivo");
        }
    }

    public EvidenciaDigital buscarPorId(Long evidenciaId) {
        return evidenciaRepositorio.findById(evidenciaId).orElseThrow(() -> new RuntimeException("Evidencia no encontrada"));
    }

    public byte[] leerContenido(EvidenciaDigital evidencia) {
        try {
            Path ruta = Paths.get(evidencia.getRutaArchivo());
            return Files.readAllBytes(ruta);
        } catch (IOException e) {
            throw new RuntimeException("No fue posible leer el archivo");
        }
    }
}

