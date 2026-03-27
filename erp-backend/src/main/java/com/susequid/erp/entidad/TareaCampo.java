package com.susequid.erp.entidad;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
}

