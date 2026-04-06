package com.susequid.erp.entidad;

import jakarta.persistence.*;

@Entity
@Table(name = "inventario_catalogos")
public class InventarioCatalogo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String nombre;

    /** JSON array de claves: nombre, serial, responsable, estado, ubicacion */
    @Column(name = "columnas_json", length = 2000)
    private String columnasJson;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getColumnasJson() {
        return columnasJson;
    }

    public void setColumnasJson(String columnasJson) {
        this.columnasJson = columnasJson;
    }
}
