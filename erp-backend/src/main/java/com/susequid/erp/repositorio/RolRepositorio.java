package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.Rol;
import com.susequid.erp.entidad.RolNombre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolRepositorio extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(RolNombre nombre);
}
