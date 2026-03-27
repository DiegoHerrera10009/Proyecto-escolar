package com.susequid.erp.entidad;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "mantenimientos_planta")
public class MantenimientoPlanta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "planta_id")
    private PlantaElectrica planta;

    @ManyToOne
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(length = 1500)
    private String descripcion;

    private String resultado;

    public Long getId() {
        return id;
    }

    public PlantaElectrica getPlanta() {
        return planta;
    }

    public void setPlanta(PlantaElectrica planta) {
        this.planta = planta;
    }

    public Usuario getTecnico() {
        return tecnico;
    }

    public void setTecnico(Usuario tecnico) {
        this.tecnico = tecnico;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }
}
