package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.InventarioCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventarioCatalogoRepositorio extends JpaRepository<InventarioCatalogo, Long> {
    boolean existsByNombreIgnoreCase(String nombre);

    Optional<InventarioCatalogo> findByNombreIgnoreCase(String nombre);
}
