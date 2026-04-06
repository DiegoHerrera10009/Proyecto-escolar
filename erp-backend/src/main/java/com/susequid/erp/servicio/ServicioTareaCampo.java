package com.susequid.erp.servicio;

import com.susequid.erp.dto.CambioEstadoTareaCampoPeticion;
import com.susequid.erp.dto.CrearTareaCampoPeticion;
import com.susequid.erp.dto.AsignarTareaCampoPeticion;
import com.susequid.erp.entidad.*;
import com.susequid.erp.repositorio.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;

@Service
public class ServicioTareaCampo {
    private final TareaCampoRepositorio tareaRepositorio;
    private final HistorialTareaCampoRepositorio historialRepositorio;
    private final EtapaTareaCampoRepositorio etapaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final FormularioDinamicoRepositorio formularioRepositorio;
    private final PlantaElectricaRepositorio plantaRepositorio;
    private final EquipoInventarioRepositorio equipoRepositorio;
    private final RespuestaFormularioRepositorio respuestaRepositorio;

    private static final Map<EstadoTareaCampo, EnumSet<EstadoTareaCampo>> TRANSICIONES_BASE = Map.of(
            EstadoTareaCampo.PENDIENTE, EnumSet.of(EstadoTareaCampo.EN_PROCESO, EstadoTareaCampo.CANCELADA),
            EstadoTareaCampo.EN_PROCESO, EnumSet.of(EstadoTareaCampo.PENDIENTE_APROBACION, EstadoTareaCampo.TERMINADA, EstadoTareaCampo.CANCELADA),
            EstadoTareaCampo.PENDIENTE_APROBACION, EnumSet.of(EstadoTareaCampo.TERMINADA, EstadoTareaCampo.EN_PROCESO, EstadoTareaCampo.CANCELADA),
            EstadoTareaCampo.TERMINADA, EnumSet.noneOf(EstadoTareaCampo.class),
            EstadoTareaCampo.CANCELADA, EnumSet.noneOf(EstadoTareaCampo.class)
    );

    public ServicioTareaCampo(
            TareaCampoRepositorio tareaRepositorio,
            HistorialTareaCampoRepositorio historialRepositorio,
            EtapaTareaCampoRepositorio etapaRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            FormularioDinamicoRepositorio formularioRepositorio,
            PlantaElectricaRepositorio plantaRepositorio,
            EquipoInventarioRepositorio equipoRepositorio,
            RespuestaFormularioRepositorio respuestaRepositorio
    ) {
        this.tareaRepositorio = tareaRepositorio;
        this.historialRepositorio = historialRepositorio;
        this.etapaRepositorio = etapaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.formularioRepositorio = formularioRepositorio;
        this.plantaRepositorio = plantaRepositorio;
        this.equipoRepositorio = equipoRepositorio;
        this.respuestaRepositorio = respuestaRepositorio;
    }

    public List<TareaCampo> listarTodas() {
        return tareaRepositorio.findAll();
    }

    public List<TareaCampo> listarPorAsignado(Long usuarioId) {
        return tareaRepositorio.findByAsignadoAId(usuarioId);
    }

    public TareaCampo buscarPorId(Long id) {
        return tareaRepositorio.findById(id).orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
    }

    public TareaCampo crear(CrearTareaCampoPeticion peticion, Usuario creadoPor) {
        if (peticion.getTitulo() == null || peticion.getTitulo().trim().isEmpty()) {
            throw new RuntimeException("El titulo es obligatorio");
        }

        TareaCampo tarea = new TareaCampo();
        tarea.setTitulo(peticion.getTitulo().trim());
        tarea.setDescripcion(peticion.getDescripcion());
        tarea.setEstado(EstadoTareaCampo.PENDIENTE);
        tarea.setCreadoPor(creadoPor);
        tarea.setLatitud(peticion.getLatitud());
        tarea.setLongitud(peticion.getLongitud());
        tarea.setFechaVencimiento(peticion.getFechaVencimiento());

        if (peticion.getAsignadoAId() != null) {
            Usuario asignado = usuarioRepositorio.findById(peticion.getAsignadoAId())
                    .orElseThrow(() -> new RuntimeException("Usuario asignado no existe"));
            tarea.setAsignadoA(asignado);
        }
        if (peticion.getFormularioId() != null) {
            FormularioDinamico formulario = formularioRepositorio.findById(peticion.getFormularioId())
                    .orElseThrow(() -> new RuntimeException("Formulario no existe"));
            tarea.setFormulario(formulario);
        }
        if (peticion.getPlantaId() != null) {
            PlantaElectrica planta = plantaRepositorio.findById(peticion.getPlantaId())
                    .orElseThrow(() -> new RuntimeException("Planta no existe"));
            tarea.setPlanta(planta);
        }
        if (peticion.getEquipoId() != null) {
            EquipoInventario equipo = equipoRepositorio.findById(peticion.getEquipoId())
                    .orElseThrow(() -> new RuntimeException("Equipo no existe"));
            tarea.setEquipo(equipo);
        }

        TareaCampo guardada = tareaRepositorio.save(tarea);

        // historial inicial
        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(guardada);
        h.setEstadoAnterior(EstadoTareaCampo.PENDIENTE);
        h.setEstadoNuevo(EstadoTareaCampo.PENDIENTE);
        h.setComentario("Tarea creada");
        h.setUsuario(creadoPor);
        historialRepositorio.save(h);

        // etapas (si vienen)
        if (peticion.getEtapas() != null && !peticion.getEtapas().isEmpty()) {
            int orden = 1;
            for (String nombre : peticion.getEtapas()) {
                if (nombre == null || nombre.trim().isEmpty()) continue;
                EtapaTareaCampo etapa = new EtapaTareaCampo();
                etapa.setTarea(guardada);
                etapa.setNombre(nombre.trim());
                etapa.setOrden(orden++);
                etapaRepositorio.save(etapa);
            }
        }

        return guardada;
    }

    public TareaCampo cambiarEstado(Long tareaId, CambioEstadoTareaCampoPeticion peticion, Usuario usuario) {
        TareaCampo tarea = buscarPorId(tareaId);

        EstadoTareaCampo estadoAnterior = tarea.getEstado();
        EstadoTareaCampo estadoNuevo = peticion.getEstadoNuevo();
        if (estadoNuevo == null) {
            throw new RuntimeException("Debe indicar estadoNuevo");
        }
        if (!TRANSICIONES_BASE.get(estadoAnterior).contains(estadoNuevo) && estadoAnterior != estadoNuevo) {
            throw new RuntimeException("Transicion no permitida");
        }

        // Si la tarea aun no tiene tecnico asignado, el tecnico que la inicia/completa queda asignado.
        boolean esTecnico = tieneRol(usuario, RolNombre.TECNICO);
        if (esTecnico && tarea.getAsignadoA() == null
                && (estadoNuevo == EstadoTareaCampo.EN_PROCESO
                || estadoNuevo == EstadoTareaCampo.PENDIENTE_APROBACION
                || estadoNuevo == EstadoTareaCampo.TERMINADA)) {
            tarea.setAsignadoA(usuario);
        }

        validarPermisoPorRolYFlujo(tarea, usuario, estadoAnterior, estadoNuevo, peticion.getComentario());

        tarea.setEstado(estadoNuevo);
        if (peticion.getLatitud() != null) tarea.setLatitud(peticion.getLatitud());
        if (peticion.getLongitud() != null) tarea.setLongitud(peticion.getLongitud());
        TareaCampo actualizada = tareaRepositorio.save(tarea);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(actualizada);
        h.setEstadoAnterior(estadoAnterior);
        h.setEstadoNuevo(estadoNuevo);
        h.setComentario(peticion.getComentario());
        h.setUsuario(usuario);
        historialRepositorio.save(h);

        return actualizada;
    }

    public List<HistorialTareaCampo> listarHistorial(Long tareaId) {
        return historialRepositorio.findByTarea_IdOrderByFechaRegistroDesc(tareaId);
    }

    public List<EtapaTareaCampo> listarEtapas(Long tareaId) {
        return etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tareaId);
    }

    public TareaCampo asignarTarea(Long tareaId, AsignarTareaCampoPeticion peticion) {
        TareaCampo tarea = buscarPorId(tareaId);
        if (peticion.getAsignadoAId() != null) {
            Usuario asignado = usuarioRepositorio.findById(peticion.getAsignadoAId())
                    .orElseThrow(() -> new RuntimeException("Usuario asignado no existe"));
            tarea.setAsignadoA(asignado);
        } else {
            tarea.setAsignadoA(null);
        }
        if (peticion.getFormularioId() != null) {
            FormularioDinamico formulario = formularioRepositorio.findById(peticion.getFormularioId())
                    .orElseThrow(() -> new RuntimeException("Formulario no existe"));
            tarea.setFormulario(formulario);
        }
        return tareaRepositorio.save(tarea);
    }

    @Transactional
    public void eliminarTarea(Long tareaId) {
        TareaCampo tarea = buscarPorId(tareaId);
        respuestaRepositorio.deleteByEtapaTareaCampo_Tarea_Id(tareaId);
        tareaRepositorio.delete(tarea);
    }

    private void validarPermisoPorRolYFlujo(
            TareaCampo tarea,
            Usuario usuario,
            EstadoTareaCampo estadoAnterior,
            EstadoTareaCampo estadoNuevo,
            String comentario
    ) {
        boolean esAdmin = tieneRol(usuario, RolNombre.ADMINISTRADOR);
        boolean esSupervisor = tieneRol(usuario, RolNombre.SUPERVISOR);
        boolean esTecnico = tieneRol(usuario, RolNombre.TECNICO);
        boolean esAsignado = tarea.getAsignadoA() != null && tarea.getAsignadoA().getId().equals(usuario.getId());

        // Cancelar: solo admin o supervisor, con motivo obligatorio
        if (estadoNuevo == EstadoTareaCampo.CANCELADA) {
            if (!(esAdmin || esSupervisor)) {
                throw new RuntimeException("Solo administrador o supervisor pueden cancelar");
            }
            if (comentario == null || comentario.trim().isEmpty()) {
                throw new RuntimeException("Debe indicar motivo de cancelacion");
            }
            return;
        }

        // Inicio y ejecucion: tecnico asignado
        if (estadoAnterior == EstadoTareaCampo.PENDIENTE && estadoNuevo == EstadoTareaCampo.EN_PROCESO) {
            if (!(esTecnico && esAsignado)) {
                throw new RuntimeException("Solo el tecnico asignado puede iniciar la tarea");
            }
            return;
        }

        if (estadoAnterior == EstadoTareaCampo.EN_PROCESO && estadoNuevo == EstadoTareaCampo.PENDIENTE_APROBACION) {
            if (!(esTecnico && esAsignado)) {
                throw new RuntimeException("Solo el tecnico asignado puede enviar a aprobacion");
            }
            return;
        }

        if (estadoAnterior == EstadoTareaCampo.EN_PROCESO && estadoNuevo == EstadoTareaCampo.TERMINADA) {
            if (!(esAdmin || (esTecnico && esAsignado))) {
                throw new RuntimeException("Solo el tecnico asignado o administrador puede finalizar desde formulario");
            }
            return;
        }

        // Revision del supervisor
        if (estadoAnterior == EstadoTareaCampo.PENDIENTE_APROBACION && estadoNuevo == EstadoTareaCampo.TERMINADA) {
            if (!esSupervisor) {
                throw new RuntimeException("Solo supervisor puede aprobar y terminar");
            }
            return;
        }

        if (estadoAnterior == EstadoTareaCampo.PENDIENTE_APROBACION && estadoNuevo == EstadoTareaCampo.EN_PROCESO) {
            if (!esSupervisor) {
                throw new RuntimeException("Solo supervisor puede rechazar y devolver a proceso");
            }
            if (comentario == null || comentario.trim().isEmpty()) {
                throw new RuntimeException("Debe indicar comentario de rechazo");
            }
            return;
        }

        throw new RuntimeException("Transicion no permitida para su rol");
    }

    private boolean tieneRol(Usuario usuario, RolNombre rol) {
        return usuario.getRoles().stream().anyMatch(r -> r.getNombre() == rol);
    }
}

