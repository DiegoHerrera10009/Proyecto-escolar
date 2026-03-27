package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.EtapaTareaCampo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EtapaTareaCampoRepositorio extends JpaRepository<EtapaTareaCampo, Long> {
    List<EtapaTareaCampo> findByTarea_IdOrderByOrdenAsc(Long tareaId);
}

