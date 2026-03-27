package com.susequid.erp.entidad;

import jakarta.persistence.*;

@Entity
@Table(name = "formularios_dinamicos")
public class FormularioDinamico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, length = 5000)
    private String esquemaJson;

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEsquemaJson() {
        return esquemaJson;
    }

    public void setEsquemaJson(String esquemaJson) {
        this.esquemaJson = esquemaJson;
    }
}
