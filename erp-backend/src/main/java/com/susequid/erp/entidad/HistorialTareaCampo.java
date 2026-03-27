package com.susequid.erp.entidad;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "historial_tarea_campo")
public class HistorialTareaCampo {
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTareaCampo estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTareaCampo estadoNuevo;

    @Column(length = 1500)
    private String comentario;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public TareaCampo getTarea() {
        return tarea;
    }

    public void setTarea(TareaCampo tarea) {
        this.tarea = tarea;
    }

    public EstadoTareaCampo getEstadoAnterior() {
        return estadoAnterior;
    }

    public void setEstadoAnterior(EstadoTareaCampo estadoAnterior) {
        this.estadoAnterior = estadoAnterior;
    }

    public EstadoTareaCampo getEstadoNuevo() {
        return estadoNuevo;
    }

    public void setEstadoNuevo(EstadoTareaCampo estadoNuevo) {
        this.estadoNuevo = estadoNuevo;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }
}

