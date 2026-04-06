package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.EstadoTareaCampo;
import com.susequid.erp.entidad.TareaCampo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TareaCampoRepositorio extends JpaRepository<TareaCampo, Long> {
    List<TareaCampo> findByAsignadoAId(Long usuarioId);

    List<TareaCampo> findByEsPlantillaFlujoTrueAndEstadoOrderByFechaCreacionDesc(EstadoTareaCampo estado);

    List<TareaCampo> findByEsPlantillaFlujoFalseAndEstadoInOrderByFechaCreacionDesc(Collection<EstadoTareaCampo> estados);

    /** Contar ejecuciones activas nacidas de una plantilla. */
    long countByPlantillaFlujoIdAndEstadoIn(Long plantillaFlujoId, Collection<EstadoTareaCampo> estados);
    long countByPlantillaFlujoId(Long plantillaFlujoId);
    List<TareaCampo> findByPlantillaFlujoId(Long plantillaFlujoId);
    long countByFormulario_Id(Long formularioId);

    /** Todas las ejecuciones (no plantillas) ordenadas por fecha. */
    List<TareaCampo> findByEsPlantillaFlujoFalseOrderByFechaCreacionDesc();
}

