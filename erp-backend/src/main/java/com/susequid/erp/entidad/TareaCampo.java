package com.susequid.erp.entidad;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tareas_campo")
public class TareaCampo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(length = 2000)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTareaCampo estado;

    @ManyToOne(optional = false)
    @JoinColumn(name = "creado_por_id")
    private Usuario creadoPor;

    @ManyToOne
    @JoinColumn(name = "asignado_a_id")
    private Usuario asignadoA;

    @ManyToOne
    @JoinColumn(name = "formulario_id")
    private FormularioDinamico formulario;

    @ManyToOne
    @JoinColumn(name = "planta_id")
    private PlantaElectrica planta;

    @ManyToOne
    @JoinColumn(name = "equipo_id")
    private EquipoInventario equipo;

    private Double latitud;
    private Double longitud;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    private LocalDateTime fechaVencimiento;

    /** Definición de flujo (plantilla) vs ejecución concreta. */
    @Column(name = "es_plantilla_flujo", nullable = false)
    private Boolean esPlantillaFlujo = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_visibilidad_flujo")
    private TipoVisibilidadFlujo tipoVisibilidadFlujo;

    @Enumerated(EnumType.STRING)
    @Column(name = "seccion_panel", nullable = false)
    private SeccionPanelFlujo seccionPanel = SeccionPanelFlujo.OPERATIVOS;

    @Column(name = "visible_en_menu_flujo", nullable = false)
    private Boolean visibleEnMenuFlujo = false;

    /**
     * Rol que puede ver el flujo en «Disponibles» e iniciar la ejecución (coincide con el primer paso).
     * {@link RolNombre#name()} — ej. TECNICO, SUPERVISOR.
     */
    @Column(name = "menu_inicio_rol", nullable = false, length = 50)
    private String menuInicioRol = RolNombre.TECNICO.name();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plantilla_flujo_id")
    @JsonIgnore
    private TareaCampo plantillaFlujo;

    @OneToMany(mappedBy = "tarea", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<HistorialTareaCampo> historial = new ArrayList<>();

    @OneToMany(mappedBy = "tarea", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<EvidenciaDigital> evidencias = new ArrayList<>();

    @OneToMany(mappedBy = "tarea", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<EtapaTareaCampo> etapas = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public EstadoTareaCampo getEstado() {
        return estado;
    }

    public void setEstado(EstadoTareaCampo estado) {
        this.estado = estado;
    }

    public Usuario getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(Usuario creadoPor) {
        this.creadoPor = creadoPor;
    }

    public Usuario getAsignadoA() {
        return asignadoA;
    }

    public void setAsignadoA(Usuario asignadoA) {
        this.asignadoA = asignadoA;
    }

    public FormularioDinamico getFormulario() {
        return formulario;
    }

    public void setFormulario(FormularioDinamico formulario) {
        this.formulario = formulario;
    }

    public PlantaElectrica getPlanta() {
        return planta;
    }

    public void setPlanta(PlantaElectrica planta) {
        this.planta = planta;
    }

    public EquipoInventario getEquipo() {
        return equipo;
    }

    public void setEquipo(EquipoInventario equipo) {
        this.equipo = equipo;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public LocalDateTime getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDateTime fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public List<HistorialTareaCampo> getHistorial() {
        return historial;
    }

    public List<EvidenciaDigital> getEvidencias() {
        return evidencias;
    }

    public List<EtapaTareaCampo> getEtapas() {
        return etapas;
    }

    public Boolean getEsPlantillaFlujo() {
        return esPlantillaFlujo;
    }

    public void setEsPlantillaFlujo(Boolean esPlantillaFlujo) {
        this.esPlantillaFlujo = esPlantillaFlujo != null ? esPlantillaFlujo : false;
    }

    public TipoVisibilidadFlujo getTipoVisibilidadFlujo() {
        return tipoVisibilidadFlujo;
    }

    public void setTipoVisibilidadFlujo(TipoVisibilidadFlujo tipoVisibilidadFlujo) {
        this.tipoVisibilidadFlujo = tipoVisibilidadFlujo;
    }

    public SeccionPanelFlujo getSeccionPanel() {
        return seccionPanel;
    }

    public void setSeccionPanel(SeccionPanelFlujo seccionPanel) {
        this.seccionPanel = seccionPanel != null ? seccionPanel : SeccionPanelFlujo.OPERATIVOS;
    }

    public Boolean getVisibleEnMenuFlujo() {
        return visibleEnMenuFlujo;
    }

    public void setVisibleEnMenuFlujo(Boolean visibleEnMenuFlujo) {
        this.visibleEnMenuFlujo = visibleEnMenuFlujo != null ? visibleEnMenuFlujo : false;
    }

    public String getMenuInicioRol() {
        return menuInicioRol;
    }

    public void setMenuInicioRol(String menuInicioRol) {
        this.menuInicioRol = menuInicioRol != null && !menuInicioRol.isBlank() ? menuInicioRol.trim() : RolNombre.TECNICO.name();
    }

    public TareaCampo getPlantillaFlujo() {
        return plantillaFlujo;
    }

    public void setPlantillaFlujo(TareaCampo plantillaFlujo) {
        this.plantillaFlujo = plantillaFlujo;
    }

    @JsonProperty("plantillaFlujoId")
    @Transient
    public Long getPlantillaFlujoIdExpuesto() {
        return plantillaFlujo != null ? plantillaFlujo.getId() : null;
    }
}

