package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.EquipoInventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EquipoInventarioRepositorio extends JpaRepository<EquipoInventario, Long> {
    Optional<EquipoInventario> findBySerial(String serial);
}
