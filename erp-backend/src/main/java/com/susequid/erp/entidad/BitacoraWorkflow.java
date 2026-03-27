package com.susequid.erp.entidad;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bitacora_workflow")
public class BitacoraWorkflow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workflow_id")
    private WorkflowProceso workflow;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoWorkflow estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoWorkflow estadoNuevo;

    @Column(length = 1000)
    private String comentario;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public WorkflowProceso getWorkflow() {
        return workflow;
    }

    public void setWorkflow(WorkflowProceso workflow) {
        this.workflow = workflow;
    }

    public EstadoWorkflow getEstadoAnterior() {
        return estadoAnterior;
    }

    public void setEstadoAnterior(EstadoWorkflow estadoAnterior) {
        this.estadoAnterior = estadoAnterior;
    }

    public EstadoWorkflow getEstadoNuevo() {
        return estadoNuevo;
    }

    public void setEstadoNuevo(EstadoWorkflow estadoNuevo) {
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
