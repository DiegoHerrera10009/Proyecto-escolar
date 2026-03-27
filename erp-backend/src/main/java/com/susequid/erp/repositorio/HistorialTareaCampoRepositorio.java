package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.HistorialTareaCampo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistorialTareaCampoRepositorio extends JpaRepository<HistorialTareaCampo, Long> {
    List<HistorialTareaCampo> findByTarea_IdOrderByFechaRegistroDesc(Long tareaId);
}

