package com.susequid.erp.entidad;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "respuestas_formulario")
public class RespuestaFormulario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "formulario_id")
    private FormularioDinamico formulario;

    @ManyToOne
    @JoinColumn(name = "planta_id")
    private PlantaElectrica planta;

    @ManyToOne
    @JoinColumn(name = "equipo_id")
    private EquipoInventario equipo;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 5000)
    private String respuestaJson;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    public Long getId() {
        return id;
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

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getRespuestaJson() {
        return respuestaJson;
    }

    public void setRespuestaJson(String respuestaJson) {
        this.respuestaJson = respuestaJson;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }
}
