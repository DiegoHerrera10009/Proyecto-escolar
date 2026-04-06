package com.susequid.erp.entidad;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;

import java.util.Collections;
import java.util.Map;

@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
@Table(
        name = "inventario_items",
        uniqueConstraints = @UniqueConstraint(columnNames = {"catalogo_id", "serial"})
)
public class InventarioItem {

    private static final ObjectMapper JSON = new ObjectMapper();
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "catalogo_id", nullable = false)
    @JsonIgnore
    private InventarioCatalogo catalogo;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 255)
    private String serial;

    private String responsable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEquipo estado;

    private String ubicacion;

    /** JSON: valores de columnas personalizadas definidas en el catálogo (mismas claves que en columnas_json). */
    @Column(name = "datos_extra_json", length = 4000)
    @JsonIgnore
    private String datosExtraJson;

    @JsonProperty("datosExtra")
    public Map<String, String> getDatosExtra() {
        if (datosExtraJson == null || datosExtraJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return JSON.readValue(datosExtraJson, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    @JsonProperty("datosExtra")
    public void setDatosExtra(Map<String, String> datos) {
        if (datos == null || datos.isEmpty()) {
            this.datosExtraJson = null;
            return;
        }
        try {
            this.datosExtraJson = JSON.writeValueAsString(datos);
        } catch (Exception e) {
            this.datosExtraJson = null;
        }
    }

    @JsonProperty("catalogoId")
    public Long getCatalogoId() {
        return catalogo != null ? catalogo.getId() : null;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InventarioCatalogo getCatalogo() {
        return catalogo;
    }

    public void setCatalogo(InventarioCatalogo catalogo) {
        this.catalogo = catalogo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getSerial() {
        return serial;
    }

    public void setSerial(String serial) {
        this.serial = serial;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }

    public EstadoEquipo getEstado() {
        return estado;
    }

    public void setEstado(EstadoEquipo estado) {
        this.estado = estado;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getDatosExtraJson() {
        return datosExtraJson;
    }

    public void setDatosExtraJson(String datosExtraJson) {
        this.datosExtraJson = datosExtraJson;
    }
}
