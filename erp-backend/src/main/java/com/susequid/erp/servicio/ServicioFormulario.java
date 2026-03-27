package com.susequid.erp.servicio;

import com.susequid.erp.entidad.FormularioDinamico;
import com.susequid.erp.entidad.RespuestaFormulario;
import com.susequid.erp.repositorio.FormularioDinamicoRepositorio;
import com.susequid.erp.repositorio.RespuestaFormularioRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioFormulario {
    private final FormularioDinamicoRepositorio formularioRepositorio;
    private final RespuestaFormularioRepositorio respuestaRepositorio;

    public ServicioFormulario(FormularioDinamicoRepositorio formularioRepositorio, RespuestaFormularioRepositorio respuestaRepositorio) {
        this.formularioRepositorio = formularioRepositorio;
        this.respuestaRepositorio = respuestaRepositorio;
    }

    public List<FormularioDinamico> listarFormularios() {
        return formularioRepositorio.findAll();
    }

    public FormularioDinamico guardarFormulario(FormularioDinamico formulario) {
        return formularioRepositorio.save(formulario);
    }

    public FormularioDinamico actualizarFormulario(Long id, FormularioDinamico formulario) {
        FormularioDinamico existente = formularioRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Formulario no encontrado"));
        existente.setNombre(formulario.getNombre());
        existente.setEsquemaJson(formulario.getEsquemaJson());
        return formularioRepositorio.save(existente);
    }

    public RespuestaFormulario guardarRespuesta(RespuestaFormulario respuesta) {
        return respuestaRepositorio.save(respuesta);
    }

    public List<RespuestaFormulario> listarRespuestas() {
        return respuestaRepositorio.findAll();
    }
}
