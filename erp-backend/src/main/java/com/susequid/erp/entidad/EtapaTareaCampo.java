package com.susequid.erp.entidad;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "etapas_tarea_campo")
@JsonIgnoreProperties(ignoreUnknown = true)
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

    @ManyToOne
    @JoinColumn(name = "formulario_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private FormularioDinamico formulario;

    /** Nombre del rol que debe ejecutar este paso (coincide con RolNombre). */
    @Column(name = "rol_responsable", length = 50)
    private String rolResponsable;

    @Column(name = "respuesta_json", columnDefinition = "TEXT")
    private String respuestaJson;

    @Column(name = "completada_en")
    private LocalDateTime completadaEn;

    @ManyToOne
    @JoinColumn(name = "completada_por_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "roles" })
    private Usuario completadaPor;

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

    public FormularioDinamico getFormulario() {
        return formulario;
    }

    public void setFormulario(FormularioDinamico formulario) {
        this.formulario = formulario;
    }

    public String getRolResponsable() {
        return rolResponsable;
    }

    public void setRolResponsable(String rolResponsable) {
        this.rolResponsable = rolResponsable;
    }

    public String getRespuestaJson() {
        return respuestaJson;
    }

    public void setRespuestaJson(String respuestaJson) {
        this.respuestaJson = respuestaJson;
    }

    public LocalDateTime getCompletadaEn() {
        return completadaEn;
    }

    public void setCompletadaEn(LocalDateTime completadaEn) {
        this.completadaEn = completadaEn;
    }

    public Usuario getCompletadaPor() {
        return completadaPor;
    }

    public void setCompletadaPor(Usuario completadaPor) {
        this.completadaPor = completadaPor;
    }
}

