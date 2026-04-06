package com.susequid.erp.servicio;

import com.susequid.erp.entidad.FormularioDinamico;
import com.susequid.erp.entidad.RespuestaFormulario;
import com.susequid.erp.repositorio.EtapaTareaCampoRepositorio;
import com.susequid.erp.repositorio.FormularioDinamicoRepositorio;
import com.susequid.erp.repositorio.RespuestaFormularioRepositorio;
import com.susequid.erp.repositorio.TareaCampoRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioFormulario {
    private final FormularioDinamicoRepositorio formularioRepositorio;
    private final RespuestaFormularioRepositorio respuestaRepositorio;
    private final TareaCampoRepositorio tareaRepositorio;
    private final EtapaTareaCampoRepositorio etapaRepositorio;

    public ServicioFormulario(
            FormularioDinamicoRepositorio formularioRepositorio,
            RespuestaFormularioRepositorio respuestaRepositorio,
            TareaCampoRepositorio tareaRepositorio,
            EtapaTareaCampoRepositorio etapaRepositorio
    ) {
        this.formularioRepositorio = formularioRepositorio;
        this.respuestaRepositorio = respuestaRepositorio;
        this.tareaRepositorio = tareaRepositorio;
        this.etapaRepositorio = etapaRepositorio;
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

    public void eliminarFormulario(Long id) {
        FormularioDinamico existente = formularioRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Formulario no encontrado"));
        long enTareas = tareaRepositorio.countByFormulario_Id(id);
        long enEtapas = etapaRepositorio.countByFormulario_Id(id);
        long enRespuestas = respuestaRepositorio.countByFormulario_Id(id);
        if (enTareas > 0 || enEtapas > 0 || enRespuestas > 0) {
            throw new RuntimeException("No se puede eliminar el formulario: tiene referencias en tareas, pasos o respuestas");
        }
        formularioRepositorio.delete(existente);
    }

    public void eliminarRespuesta(Long id) {
        if (!respuestaRepositorio.existsById(id)) {
            throw new RuntimeException("Registro de respuesta no encontrado");
        }
        respuestaRepositorio.deleteById(id);
    }
}
