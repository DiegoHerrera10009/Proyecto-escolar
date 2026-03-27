package com.susequid.erp.entidad;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "etapas_tarea_campo")
public class EtapaTareaCampo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tarea_id")
    @JsonIgnore
    private TareaCampo tarea;

    @Transient
    public Long getTareaId() {
        return tarea != null ? tarea.getId() : null;
    }

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private Integer orden;

    @Column(nullable = false)
    private Boolean completada = false;

    public Long getId() {
        return id;
    }

    public TareaCampo getTarea() {
        return tarea;
    }

    public void setTarea(TareaCampo tarea) {
        this.tarea = tarea;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public Boolean getCompletada() {
        return completada;
    }

    public void setCompletada(Boolean completada) {
        this.completada = completada;
    }
}

