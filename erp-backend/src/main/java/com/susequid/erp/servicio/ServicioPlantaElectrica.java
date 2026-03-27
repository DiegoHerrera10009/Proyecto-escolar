package com.susequid.erp.servicio;

import com.susequid.erp.entidad.PlantaElectrica;
import com.susequid.erp.repositorio.PlantaElectricaRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioPlantaElectrica {
    private final PlantaElectricaRepositorio repositorio;

    public ServicioPlantaElectrica(PlantaElectricaRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    public List<PlantaElectrica> listar() {
        return repositorio.findAll();
    }

    public PlantaElectrica guardar(PlantaElectrica planta) {
        return repositorio.save(planta);
    }

    public PlantaElectrica buscarPorId(Long id) {
        return repositorio.findById(id).orElseThrow(() -> new RuntimeException("Planta no encontrada"));
    }

    public void eliminar(Long id) {
        repositorio.deleteById(id);
    }
}
