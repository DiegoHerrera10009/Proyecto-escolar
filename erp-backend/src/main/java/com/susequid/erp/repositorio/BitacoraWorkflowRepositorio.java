package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.BitacoraWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BitacoraWorkflowRepositorio extends JpaRepository<BitacoraWorkflow, Long> {
    List<BitacoraWorkflow> findByWorkflowIdOrderByFechaRegistroDesc(Long workflowId);
}
