package com.susequid.erp.servicio;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.susequid.erp.entidad.EstadoEquipo;
import com.susequid.erp.entidad.InventarioCatalogo;
import com.susequid.erp.entidad.InventarioItem;
import com.susequid.erp.repositorio.InventarioCatalogoRepositorio;
import com.susequid.erp.repositorio.InventarioItemRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ServicioInventarioCatalogo {
    private static final List<String> COLUMNAS_DEFECTO = List.of(
            "nombre", "serial", "responsable", "estado", "ubicacion"
    );
    private static final Set<String> CLAVES_PERMITIDAS = Set.of(
            "nombre", "serial", "responsable", "estado", "ubicacion"
    );

    private final InventarioCatalogoRepositorio catalogoRepositorio;
    private final InventarioItemRepositorio itemRepositorio;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ServicioInventarioCatalogo(
            InventarioCatalogoRepositorio catalogoRepositorio,
            InventarioItemRepositorio itemRepositorio
    ) {
        this.catalogoRepositorio = catalogoRepositorio;
        this.itemRepositorio = itemRepositorio;
    }

    public List<InventarioCatalogo> listarCatalogos() {
        return catalogoRepositorio.findAll();
    }

    public InventarioCatalogo crearCatalogo(String nombre) {
        return crearCatalogo(nombre, null);
    }

    public InventarioCatalogo crearCatalogo(String nombre, List<String> columnas) {
        String n = nombre != null ? nombre.trim() : "";
        if (n.isEmpty()) {
            throw new IllegalArgumentException("El nombre del catálogo es obligatorio");
        }
        if (catalogoRepositorio.existsByNombreIgnoreCase(n)) {
            throw new IllegalArgumentException("Ya existe un catálogo con ese nombre");
        }
        InventarioCatalogo c = new InventarioCatalogo();
        c.setNombre(n);
        List<String> cols = normalizarColumnas(columnas);
        try {
            c.setColumnasJson(objectMapper.writeValueAsString(cols));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("No se pudo guardar el esquema de columnas");
        }
        return catalogoRepositorio.save(c);
    }

    private List<String> normalizarColumnas(List<String> columnas) {
        if (columnas == null || columnas.isEmpty()) {
            return new ArrayList<>(COLUMNAS_DEFECTO);
        }
        LinkedHashSet<String> set = new LinkedHashSet<>();
        set.add("nombre");
        for (String col : columnas) {
            if (col == null) {
                continue;
            }
            String t = col.trim();
            if (t.isEmpty()) {
                continue;
            }
            String k = t.toLowerCase();
            if (CLAVES_PERMITIDAS.contains(k)) {
                set.add(k);
            } else if (esEtiquetaColumnaPersonalizadaValida(t)) {
                set.add(t);
            }
        }
        return new ArrayList<>(set);
    }

    /** Etiqueta visible para columnas no estándar (no puede coincidir con reservadas). */
    private boolean esEtiquetaColumnaPersonalizadaValida(String t) {
        if (t.length() > 80) {
            return false;
        }
        if (CLAVES_PERMITIDAS.contains(t.toLowerCase())) {
            return false;
        }
        return t.matches("^[\\p{L}0-9 .,_\\-]+$");
    }

    @Transactional
    public void eliminarCatalogo(Long id, boolean forzar) {
        InventarioCatalogo c = catalogoRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catálogo no encontrado"));
        long n = itemRepositorio.countByCatalogo_Id(id);
        if (n > 0 && !forzar) {
            throw new IllegalArgumentException(
                    "El catálogo tiene ítems. Elimínalos antes o usa borrado forzado."
            );
        }
        if (n > 0) {
            itemRepositorio.deleteAll(itemRepositorio.findByCatalogo_IdOrderByNombreAsc(id));
        }
        catalogoRepositorio.delete(c);
    }

    public List<InventarioItem> listarItems(Long catalogoId) {
        if (!catalogoRepositorio.existsById(catalogoId)) {
            throw new IllegalArgumentException("Catálogo no encontrado");
        }
        return itemRepositorio.findByCatalogo_IdOrderByNombreAsc(catalogoId);
    }

    public InventarioItem crearItem(Long catalogoId, InventarioItem datos) {
        InventarioCatalogo cat = catalogoRepositorio.findById(catalogoId)
                .orElseThrow(() -> new IllegalArgumentException("Catálogo no encontrado"));
        if (datos.getNombre() == null || datos.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del ítem es obligatorio");
        }
        InventarioItem item = new InventarioItem();
        item.setCatalogo(cat);
        item.setNombre(datos.getNombre().trim());
        String serial = datos.getSerial() != null ? datos.getSerial().trim() : "";
        item.setSerial(serial.isEmpty() ? null : serial);
        item.setResponsable(datos.getResponsable() != null ? datos.getResponsable().trim() : null);
        item.setUbicacion(datos.getUbicacion() != null ? datos.getUbicacion().trim() : null);
        item.setEstado(datos.getEstado() != null ? datos.getEstado() : EstadoEquipo.ACTIVO);
        Map<String, String> extra = datos.getDatosExtra();
        if (extra != null && !extra.isEmpty()) {
            item.setDatosExtra(extra);
        }
        return itemRepositorio.save(item);
    }

    public InventarioItem actualizarItem(Long itemId, InventarioItem datos) {
        InventarioItem item = itemRepositorio.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Ítem no encontrado"));
        if (datos.getNombre() != null && !datos.getNombre().trim().isEmpty()) {
            item.setNombre(datos.getNombre().trim());
        }
        if (datos.getSerial() != null) {
            String s = datos.getSerial().trim();
            item.setSerial(s.isEmpty() ? null : s);
        }
        if (datos.getResponsable() != null) {
            item.setResponsable(datos.getResponsable().trim().isEmpty() ? null : datos.getResponsable().trim());
        }
        if (datos.getUbicacion() != null) {
            item.setUbicacion(datos.getUbicacion().trim().isEmpty() ? null : datos.getUbicacion().trim());
        }
        if (datos.getEstado() != null) {
            item.setEstado(datos.getEstado());
        }
        if (datos.getDatosExtra() != null) {
            item.setDatosExtra(datos.getDatosExtra());
        }
        return itemRepositorio.save(item);
    }

    public void eliminarItem(Long itemId) {
        if (!itemRepositorio.existsById(itemId)) {
            throw new IllegalArgumentException("Ítem no encontrado");
        }
        itemRepositorio.deleteById(itemId);
    }
}
