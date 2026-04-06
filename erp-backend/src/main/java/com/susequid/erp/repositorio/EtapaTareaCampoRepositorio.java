package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.EtapaTareaCampo;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EtapaTareaCampoRepositorio extends JpaRepository<EtapaTareaCampo, Long> {
    @EntityGraph(attributePaths = { "formulario", "completadaPor" })
    List<EtapaTareaCampo> findByTarea_IdOrderByOrdenAsc(Long tareaId);
    long countByFormulario_Id(Long formularioId);
}

