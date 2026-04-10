package com.susequid.erp.repositorio;

import com.susequid.erp.entidad.InventarioItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventarioItemRepositorio extends JpaRepository<InventarioItem, Long> {
    List<InventarioItem> findByCatalogo_IdOrderByNombreAsc(Long catalogoId);

    long countByCatalogo_Id(Long catalogoId);

    Optional<InventarioItem> findByCatalogo_IdAndSerial(Long catalogoId, String serial);
}
