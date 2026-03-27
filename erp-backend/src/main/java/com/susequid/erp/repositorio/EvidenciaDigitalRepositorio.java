package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.EvidenciaDigital;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvidenciaDigitalRepositorio extends JpaRepository<EvidenciaDigital, Long> {
    List<EvidenciaDigital> findByTarea_IdOrderByFechaRegistroDesc(Long tareaId);
}

