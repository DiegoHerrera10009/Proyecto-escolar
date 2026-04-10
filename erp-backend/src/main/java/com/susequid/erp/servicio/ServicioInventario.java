package com.susequid.erp.servicio;

import com.susequid.erp.dto.FilaImportarInventario;
import com.susequid.erp.dto.ImportarInventarioResultado;
import com.susequid.erp.entidad.EquipoInventario;
import com.susequid.erp.entidad.EstadoEquipo;
import com.susequid.erp.repositorio.EquipoInventarioRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ServicioInventario {
    private static final int MAX_FILAS_IMPORTACION = 5000;

    private final EquipoInventarioRepositorio repositorio;

    public ServicioInventario(EquipoInventarioRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    public List<EquipoInventario> listar() {
        return repositorio.findAll();
    }

    public EquipoInventario guardar(EquipoInventario equipo) {
        if (equipo.getCantidad() == null || equipo.getCantidad() < 0) {
            equipo.setCantidad(1);
        }
        return repositorio.save(equipo);
    }

    public void eliminar(Long id) {
        repositorio.deleteById(id);
    }

    /**
     * Importa filas codigo → serial, descripcion → nombre, existencias → cantidad.
     * Si el código ya existe, actualiza nombre y cantidad.
     */
    @Transactional
    public ImportarInventarioResultado importarFilas(List<FilaImportarInventario> filas) {
        ImportarInventarioResultado res = new ImportarInventarioResultado();
        if (filas == null || filas.isEmpty()) {
            res.getErrores().add("No se enviaron filas para importar");
            return res;
        }
        if (filas.size() > MAX_FILAS_IMPORTACION) {
            res.getErrores().add("Máximo " + MAX_FILAS_IMPORTACION + " filas por importación");
            return res;
        }
        Set<String> vistosEnArchivo = new HashSet<>();
        int n = 0;
        for (FilaImportarInventario f : filas) {
            n++;
            if (f == null) {
                res.setIgnorados(res.getIgnorados() + 1);
                continue;
            }
            String codigo = f.getCodigo() != null ? f.getCodigo().trim() : "";
            String desc = f.getDescripcion() != null ? f.getDescripcion().trim() : "";
            if (codigo.isEmpty() && desc.isEmpty()) {
                res.setIgnorados(res.getIgnorados() + 1);
                continue;
            }
            if (codigo.isEmpty()) {
                res.getErrores().add("Fila " + n + ": falta código de producto");
                continue;
            }
            if (desc.isEmpty()) {
                res.getErrores().add("Fila " + n + " (código " + codigo + "): falta descripción");
                continue;
            }
            String codigoNorm = codigo.toUpperCase();
            if (!vistosEnArchivo.add(codigoNorm)) {
                res.getErrores().add("Fila " + n + ": código duplicado en el archivo (" + codigo + ")");
                continue;
            }
            int cant = 1;
            if (f.getExistencias() != null) {
                cant = f.getExistencias();
            }
            if (cant < 0) {
                res.getErrores().add("Fila " + n + " (" + codigo + "): existencias no pueden ser negativas");
                continue;
            }

            Optional<EquipoInventario> opt = repositorio.findBySerial(codigo);
            if (opt.isPresent()) {
                EquipoInventario e = opt.get();
                e.setNombre(desc);
                e.setCantidad(cant);
                if (f.getResponsable() != null && !f.getResponsable().isBlank()) {
                    e.setResponsable(f.getResponsable().trim());
                }
                if (f.getUbicacion() != null && !f.getUbicacion().isBlank()) {
                    e.setUbicacion(f.getUbicacion().trim());
                }
                repositorio.save(e);
                res.setActualizados(res.getActualizados() + 1);
            } else {
                EquipoInventario e = new EquipoInventario();
                e.setSerial(codigo);
                e.setNombre(desc);
                e.setCantidad(cant);
                e.setEstado(EstadoEquipo.ACTIVO);
                if (f.getResponsable() != null && !f.getResponsable().isBlank()) {
                    e.setResponsable(f.getResponsable().trim());
                }
                if (f.getUbicacion() != null && !f.getUbicacion().isBlank()) {
                    e.setUbicacion(f.getUbicacion().trim());
                }
                repositorio.save(e);
                res.setCreados(res.getCreados() + 1);
            }
        }
        return res;
    }
}
