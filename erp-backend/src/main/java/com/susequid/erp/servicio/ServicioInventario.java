package com.susequid.erp.servicio;

import com.susequid.erp.entidad.EquipoInventario;
import com.susequid.erp.repositorio.EquipoInventarioRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioInventario {
    private final EquipoInventarioRepositorio repositorio;

    public ServicioInventario(EquipoInventarioRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    public List<EquipoInventario> listar() {
        return repositorio.findAll();
    }

    public EquipoInventario guardar(EquipoInventario equipo) {
        return repositorio.save(equipo);
    }

    public void eliminar(Long id) {
        repositorio.deleteById(id);
    }
}
