package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.RespuestaFormulario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RespuestaFormularioRepositorio extends JpaRepository<RespuestaFormulario, Long> {
    long countByFormulario_Id(Long formularioId);
    void deleteByEtapaTareaCampo_Tarea_Id(Long tareaId);
    void deleteByFormulario_Id(Long formularioId);
}
