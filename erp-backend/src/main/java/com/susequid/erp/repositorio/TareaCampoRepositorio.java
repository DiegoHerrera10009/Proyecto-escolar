package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.TareaCampo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TareaCampoRepositorio extends JpaRepository<TareaCampo, Long> {
    List<TareaCampo> findByAsignadoAId(Long usuarioId);
}

