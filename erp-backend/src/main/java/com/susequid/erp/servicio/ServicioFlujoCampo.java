package com.susequid.erp.servicio;

import com.susequid.erp.dto.CompletarPasoFlujoPeticion;
import com.susequid.erp.dto.CrearInstanciaFlujoPeticion;
import com.susequid.erp.dto.CrearPlantillaFlujoPeticion;
import com.susequid.erp.dto.PasoFlujoDefPeticion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.susequid.erp.entidad.*;
import com.susequid.erp.repositorio.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ServicioFlujoCampo {
    private final TareaCampoRepositorio tareaRepositorio;
    private final EtapaTareaCampoRepositorio etapaRepositorio;
    private final FormularioDinamicoRepositorio formularioRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final HistorialTareaCampoRepositorio historialRepositorio;
    private final RespuestaFormularioRepositorio respuestaRepositorio;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ServicioFlujoCampo(
            TareaCampoRepositorio tareaRepositorio,
            EtapaTareaCampoRepositorio etapaRepositorio,
            FormularioDinamicoRepositorio formularioRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            HistorialTareaCampoRepositorio historialRepositorio,
            RespuestaFormularioRepositorio respuestaRepositorio
    ) {
        this.tareaRepositorio = tareaRepositorio;
        this.etapaRepositorio = etapaRepositorio;
        this.formularioRepositorio = formularioRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.historialRepositorio = historialRepositorio;
        this.respuestaRepositorio = respuestaRepositorio;
    }

    // =====================================================
    // PLANTILLAS — CRUD
    // =====================================================

    @Transactional
    public TareaCampo crearPlantilla(CrearPlantillaFlujoPeticion peticion, Usuario admin) {
        validarTitulo(peticion.getTitulo());
        if (peticion.getTipoVisibilidad() == null) {
            throw new RuntimeException("Debe indicar tipo de visibilidad del flujo");
        }
        if (peticion.getPasos() == null || peticion.getPasos().isEmpty()) {
            throw new RuntimeException("El flujo debe tener al menos un paso");
        }
        validarPasosDefinicion(peticion.getPasos());

        TareaCampo t = new TareaCampo();
        t.setTitulo(peticion.getTitulo().trim());
        t.setDescripcion(peticion.getDescripcion());
        t.setEstado(EstadoTareaCampo.BORRADOR);
        t.setEsPlantillaFlujo(true);
        t.setTipoVisibilidadFlujo(peticion.getTipoVisibilidad());
        t.setSeccionPanel(peticion.getSeccionPanel() != null ? peticion.getSeccionPanel() : SeccionPanelFlujo.OPERATIVOS);
        if (peticion.getTipoVisibilidad() == TipoVisibilidadFlujo.INSTANCIA_UNICA) {
            t.setVisibleEnMenuFlujo(false);
        } else {
            t.setVisibleEnMenuFlujo(Boolean.TRUE.equals(peticion.getVisibleEnMenuFlujo()));
        }

        // Normalizar orden de pasos y determinar primer paso / rol de inicio
        List<PasoFlujoDefPeticion> pasosOrdenados = normalizarOrdenPasos(peticion.getPasos());
        String rolPrimerPaso = normalizarRol(pasosOrdenados.get(0).getRolResponsable());
        String menuRol = (peticion.getMenuInicioRol() != null && !peticion.getMenuInicioRol().isBlank())
                ? normalizarRol(peticion.getMenuInicioRol())
                : rolPrimerPaso;
        if (!menuRol.equals(rolPrimerPaso)) {
            throw new RuntimeException("El rol del menu de inicio debe coincidir con el primer paso del flujo");
        }
        t.setMenuInicioRol(menuRol);
        t.setCreadoPor(admin);
        t = tareaRepositorio.save(t);

        guardarEtapasDesdePeticion(t, pasosOrdenados);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(t);
        h.setEstadoAnterior(EstadoTareaCampo.BORRADOR);
        h.setEstadoNuevo(EstadoTareaCampo.BORRADOR);
        h.setComentario("Plantilla de flujo creada (borrador)");
        h.setUsuario(admin);
        historialRepositorio.save(h);

        return tareaRepositorio.findById(t.getId()).orElse(t);
    }

    @Transactional
    public TareaCampo editarPlantilla(Long plantillaId, CrearPlantillaFlujoPeticion peticion, Usuario admin) {
        TareaCampo t = buscarPlantilla(plantillaId);
        if (t.getEstado() != EstadoTareaCampo.BORRADOR) {
            throw new RuntimeException("Solo se puede editar una plantilla en borrador");
        }
        if (peticion.getTitulo() != null && !peticion.getTitulo().isBlank()) {
            t.setTitulo(peticion.getTitulo().trim());
        }
        if (peticion.getDescripcion() != null) {
            t.setDescripcion(peticion.getDescripcion());
        }
        if (peticion.getTipoVisibilidad() != null) {
            t.setTipoVisibilidadFlujo(peticion.getTipoVisibilidad());
        }
        if (peticion.getSeccionPanel() != null) {
            t.setSeccionPanel(peticion.getSeccionPanel());
        }
        if (t.getTipoVisibilidadFlujo() == TipoVisibilidadFlujo.INSTANCIA_UNICA) {
            t.setVisibleEnMenuFlujo(false);
        } else if (peticion.getVisibleEnMenuFlujo() != null) {
            t.setVisibleEnMenuFlujo(peticion.getVisibleEnMenuFlujo());
        }

        // Si vienen pasos nuevos, reemplazar todos los anteriores
        if (peticion.getPasos() != null && !peticion.getPasos().isEmpty()) {
            validarPasosDefinicion(peticion.getPasos());
            List<PasoFlujoDefPeticion> pasosOrdenados = normalizarOrdenPasos(peticion.getPasos());

            // Eliminar etapas existentes
            List<EtapaTareaCampo> etapasViejas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(t.getId());
            etapaRepositorio.deleteAll(etapasViejas);
            etapaRepositorio.flush();

            guardarEtapasDesdePeticion(t, pasosOrdenados);

            String rolPrimerPaso = normalizarRol(pasosOrdenados.get(0).getRolResponsable());
            String menuRol = (peticion.getMenuInicioRol() != null && !peticion.getMenuInicioRol().isBlank())
                    ? normalizarRol(peticion.getMenuInicioRol())
                    : rolPrimerPaso;
            if (!menuRol.equals(rolPrimerPaso)) {
                throw new RuntimeException("El rol del menu de inicio debe coincidir con el primer paso del flujo");
            }
            t.setMenuInicioRol(menuRol);
        } else if (peticion.getMenuInicioRol() != null && !peticion.getMenuInicioRol().isBlank()) {
            t.setMenuInicioRol(normalizarRol(peticion.getMenuInicioRol()));
        }

        t = tareaRepositorio.save(t);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(t);
        h.setEstadoAnterior(EstadoTareaCampo.BORRADOR);
        h.setEstadoNuevo(EstadoTareaCampo.BORRADOR);
        h.setComentario("Plantilla editada");
        h.setUsuario(admin);
        historialRepositorio.save(h);

        return tareaRepositorio.findById(t.getId()).orElse(t);
    }

    public List<TareaCampo> listarPlantillas(EstadoTareaCampo estado) {
        if (estado != EstadoTareaCampo.BORRADOR && estado != EstadoTareaCampo.PUBLICADA) {
            throw new RuntimeException("Solo se listan plantillas en BORRADOR o PUBLICADA");
        }
        return tareaRepositorio.findByEsPlantillaFlujoTrueAndEstadoOrderByFechaCreacionDesc(estado);
    }

    public List<EtapaTareaCampo> obtenerPasosPlantilla(Long plantillaId) {
        buscarPlantilla(plantillaId);
        return etapaRepositorio.findByTarea_IdOrderByOrdenAsc(plantillaId);
    }

    @Transactional
    public TareaCampo publicarPlantilla(Long plantillaId, Usuario admin) {
        TareaCampo t = buscarPlantilla(plantillaId);
        if (t.getEstado() != EstadoTareaCampo.BORRADOR) {
            throw new RuntimeException("Solo se puede publicar una plantilla en borrador");
        }
        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(t.getId());
        validarPasosPublicacion(etapas);

        if (t.getTipoVisibilidadFlujo() == TipoVisibilidadFlujo.MENU_PERMANENTE
                && !Boolean.TRUE.equals(t.getVisibleEnMenuFlujo())) {
            throw new RuntimeException("Flujo de menu permanente debe estar marcado como visible en el panel");
        }
        List<EtapaTareaCampo> ordenEtapas = etapas.stream()
                .sorted(Comparator.comparing(EtapaTareaCampo::getOrden))
                .toList();
        if (!ordenEtapas.isEmpty()
                && !ordenEtapas.get(0).getRolResponsable().equals(t.getMenuInicioRol())) {
            throw new RuntimeException("El primer paso debe tener el mismo rol que el menu de inicio ("
                    + t.getMenuInicioRol() + ")");
        }

        EstadoTareaCampo ant = t.getEstado();
        t.setEstado(EstadoTareaCampo.PUBLICADA);
        t = tareaRepositorio.save(t);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(t);
        h.setEstadoAnterior(ant);
        h.setEstadoNuevo(EstadoTareaCampo.PUBLICADA);
        h.setComentario("Flujo publicado por administracion");
        h.setUsuario(admin);
        historialRepositorio.save(h);
        return t;
    }

    @Transactional
    public TareaCampo despublicarPlantilla(Long plantillaId, Usuario admin) {
        TareaCampo t = buscarPlantilla(plantillaId);
        if (t.getEstado() != EstadoTareaCampo.PUBLICADA) {
            throw new RuntimeException("Solo se puede despublicar una plantilla publicada");
        }
        // Verificar que no haya ejecuciones activas
        List<EstadoTareaCampo> estadosActivos = List.of(EstadoTareaCampo.EN_PROCESO, EstadoTareaCampo.PENDIENTE);
        long activas = tareaRepositorio.countByPlantillaFlujoIdAndEstadoIn(plantillaId, estadosActivos);
        if (activas > 0) {
            throw new RuntimeException("No se puede despublicar: hay " + activas + " ejecucion(es) activa(s) de este flujo");
        }

        EstadoTareaCampo ant = t.getEstado();
        t.setEstado(EstadoTareaCampo.BORRADOR);
        t = tareaRepositorio.save(t);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(t);
        h.setEstadoAnterior(ant);
        h.setEstadoNuevo(EstadoTareaCampo.BORRADOR);
        h.setComentario("Plantilla despublicada por administracion");
        h.setUsuario(admin);
        historialRepositorio.save(h);
        return t;
    }

    @Transactional
    public void eliminarPlantilla(Long plantillaId, Usuario admin, boolean forzarConEjecuciones) {
        TareaCampo plantilla = buscarPlantilla(plantillaId);
        List<TareaCampo> ejecuciones = tareaRepositorio.findByPlantillaFlujoId(plantillaId);
        if (!forzarConEjecuciones && !ejecuciones.isEmpty()) {
            throw new RuntimeException("No se puede eliminar la plantilla: tiene ejecuciones asociadas");
        }
        for (TareaCampo ejecucion : ejecuciones) {
            respuestaRepositorio.deleteByEtapaTareaCampo_Tarea_Id(ejecucion.getId());
        }
        if (!ejecuciones.isEmpty()) {
            tareaRepositorio.deleteAll(ejecuciones);
            tareaRepositorio.flush();
        }
        tareaRepositorio.delete(plantilla);
    }

    // =====================================================
    // MENÚ — qué ve el usuario en "Disponibles"
    // =====================================================

    public List<TareaCampo> listarPlantillasMenu(String seccionPanel, Usuario usuario) {
        SeccionPanelFlujo sec = parseSeccion(seccionPanel);
        return tareaRepositorio.findByEsPlantillaFlujoTrueAndEstadoOrderByFechaCreacionDesc(EstadoTareaCampo.PUBLICADA).stream()
                .filter(t -> t.getTipoVisibilidadFlujo() == TipoVisibilidadFlujo.MENU_PERMANENTE)
                .filter(t -> Boolean.TRUE.equals(t.getVisibleEnMenuFlujo()))
                .filter(t -> t.getSeccionPanel() == sec)
                .filter(t -> usuarioEsAdministrador(usuario) || usuarioTieneRolNombre(usuario, t.getMenuInicioRol()))
                .collect(Collectors.toList());
    }

    // =====================================================
    // EJECUCIONES — iniciar, completar pasos
    // =====================================================

    @Transactional
    public TareaCampo iniciarEjecucionDesdeMenu(Long plantillaId, Usuario usuario) {
        TareaCampo plantilla = buscarPlantillaPublicada(plantillaId);
        if (plantilla.getTipoVisibilidadFlujo() != TipoVisibilidadFlujo.MENU_PERMANENTE) {
            throw new RuntimeException("Este flujo no esta disponible para inicio desde el menu");
        }
        if (!Boolean.TRUE.equals(plantilla.getVisibleEnMenuFlujo())) {
            throw new RuntimeException("Flujo no visible en el panel");
        }
        if (!usuarioEsAdministrador(usuario) && !usuarioTieneRolNombre(usuario, plantilla.getMenuInicioRol())) {
            throw new RuntimeException("Solo un usuario con rol " + plantilla.getMenuInicioRol()
                    + " puede iniciar este flujo desde el menu");
        }
        return clonarEjecucion(plantilla, plantilla.getTitulo() + " — " + LocalDateTime.now().toLocalDate(),
                null, usuario);
    }

    @Transactional
    public TareaCampo crearInstanciaDesdePlantilla(CrearInstanciaFlujoPeticion peticion, Usuario admin) {
        if (peticion.getPlantillaId() == null) {
            throw new RuntimeException("plantillaId es obligatorio");
        }
        TareaCampo plantilla = buscarPlantillaPublicada(peticion.getPlantillaId());
        if (plantilla.getTipoVisibilidadFlujo() != TipoVisibilidadFlujo.INSTANCIA_UNICA) {
            throw new RuntimeException("Solo plantillas de instancia unica se crean desde este endpoint");
        }
        String titulo = peticion.getTitulo() != null && !peticion.getTitulo().isBlank()
                ? peticion.getTitulo().trim()
                : plantilla.getTitulo() + " — ejecución";
        Usuario asignado = null;
        if (peticion.getAsignadoAId() != null) {
            asignado = usuarioRepositorio.findById(peticion.getAsignadoAId())
                    .orElseThrow(() -> new RuntimeException("Usuario asignado no existe"));
        }
        return clonarEjecucion(plantilla, titulo, asignado, admin);
    }

    // =====================================================
    // MIS ACTIVIDADES — lo que ve técnico / supervisor
    // =====================================================

    public List<TareaCampo> listarMisActividadesActivas(Usuario usuario) {
        List<EstadoTareaCampo> estados = List.of(EstadoTareaCampo.EN_PROCESO, EstadoTareaCampo.PENDIENTE);
        return tareaRepositorio.findByEsPlantillaFlujoFalseAndEstadoInOrderByFechaCreacionDesc(estados).stream()
                .filter(this::esEjecucionConFlujoPorEtapas)
                .filter(t -> puedeActuarEnPasoActual(t, usuario))
                .collect(Collectors.toList());
    }

    public List<TareaCampo> listarMisActividadesHistorial(Usuario usuario) {
        List<EstadoTareaCampo> estados = List.of(EstadoTareaCampo.TERMINADA, EstadoTareaCampo.CANCELADA);
        return tareaRepositorio.findByEsPlantillaFlujoFalseAndEstadoInOrderByFechaCreacionDesc(estados).stream()
                .filter(this::esEjecucionConFlujoPorEtapas)
                .filter(t -> usuarioParticipoEnEjecucion(t, usuario))
                .collect(Collectors.toList());
    }

    /**
     * Flujos activos donde el usuario ya participó o los inició, pero en este momento no es su turno (solo seguimiento).
     */
    public List<TareaCampo> listarMisFlujosSoloSeguimiento(Usuario usuario) {
        List<TareaCampo> enMiTurno = listarMisActividadesActivas(usuario);
        Set<Long> idsTurno = enMiTurno.stream().map(TareaCampo::getId).collect(Collectors.toSet());
        List<EstadoTareaCampo> estados = List.of(EstadoTareaCampo.EN_PROCESO, EstadoTareaCampo.PENDIENTE);
        return tareaRepositorio.findByEsPlantillaFlujoFalseAndEstadoInOrderByFechaCreacionDesc(estados).stream()
                .filter(this::esEjecucionConFlujoPorEtapas)
                .filter(t -> !idsTurno.contains(t.getId()))
                .filter(t -> usuarioTieneInteresEnFlujoActivo(t, usuario))
                .collect(Collectors.toList());
    }

    // =====================================================
    // ADMIN — monitoreo y control de ejecuciones
    // =====================================================

    /**
     * Listar todas las ejecuciones de flujo (para admin), con filtro opcional de estado.
     */
    public List<TareaCampo> listarEjecucionesAdmin(EstadoTareaCampo filtroEstado) {
        if (filtroEstado != null) {
            return tareaRepositorio.findByEsPlantillaFlujoFalseAndEstadoInOrderByFechaCreacionDesc(
                    List.of(filtroEstado)
            ).stream().filter(this::esEjecucionConFlujoPorEtapas).collect(Collectors.toList());
        }
        return tareaRepositorio.findByEsPlantillaFlujoFalseOrderByFechaCreacionDesc().stream()
                .filter(this::esEjecucionConFlujoPorEtapas)
                .collect(Collectors.toList());
    }

    /**
     * Cancelar o finalizar una ejecución de flujo de emergencia (admin).
     */
    @Transactional
    public TareaCampo cambiarEstadoEjecucionAdmin(Long tareaId, EstadoTareaCampo nuevoEstado, String motivo, Usuario admin) {
        TareaCampo tarea = tareaRepositorio.findById(tareaId)
                .orElseThrow(() -> new RuntimeException("Ejecucion no encontrada"));
        if (Boolean.TRUE.equals(tarea.getEsPlantillaFlujo())) {
            throw new RuntimeException("No se puede cambiar estado de una plantilla desde aqui");
        }
        if (tarea.getEstado() == EstadoTareaCampo.TERMINADA || tarea.getEstado() == EstadoTareaCampo.CANCELADA) {
            throw new RuntimeException("La ejecucion ya finalizo");
        }
        if (nuevoEstado != EstadoTareaCampo.CANCELADA && nuevoEstado != EstadoTareaCampo.TERMINADA) {
            throw new RuntimeException("Solo se permite CANCELADA o TERMINADA desde el panel admin");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new RuntimeException("Debe indicar el motivo (emergencia)");
        }

        EstadoTareaCampo ant = tarea.getEstado();
        tarea.setEstado(nuevoEstado);
        tarea = tareaRepositorio.save(tarea);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(tarea);
        h.setEstadoAnterior(ant);
        h.setEstadoNuevo(nuevoEstado);
        h.setComentario("[ADMIN EMERGENCIA] " + motivo.trim());
        h.setUsuario(admin);
        historialRepositorio.save(h);

        return tarea;
    }

    // =====================================================
    // COMPLETAR PASO
    // =====================================================

    @Transactional
    public TareaCampo completarPaso(Long tareaId, Long etapaId, CompletarPasoFlujoPeticion peticion, Usuario usuario) {
        TareaCampo tarea = tareaRepositorio.findById(tareaId)
                .orElseThrow(() -> new RuntimeException("Actividad no encontrada"));
        if (Boolean.TRUE.equals(tarea.getEsPlantillaFlujo())) {
            throw new RuntimeException("No se completa paso sobre una plantilla");
        }
        if (tarea.getEstado() == EstadoTareaCampo.TERMINADA || tarea.getEstado() == EstadoTareaCampo.CANCELADA) {
            throw new RuntimeException("La actividad ya finalizo");
        }
        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tareaId);
        EtapaTareaCampo pasoActivo = pasoActivo(etapas);
        if (pasoActivo == null || !pasoActivo.getId().equals(etapaId)) {
            throw new RuntimeException("Solo puede completar el paso activo del flujo y en orden");
        }
        if (!puedeUsuarioEjecutarPaso(tarea, pasoActivo, usuario)) {
            throw new RuntimeException("No tiene turno para este paso");
        }
        String json = peticion.getRespuestaJson() != null ? peticion.getRespuestaJson() : "{}";
        if (json.length() > 4900) {
            throw new RuntimeException("Respuesta demasiado larga");
        }
        if (!tieneFirmaValida(json)) {
            throw new RuntimeException("La firma es obligatoria para completar el formulario");
        }

        pasoActivo.setCompletada(true);
        pasoActivo.setRespuestaJson(json);
        pasoActivo.setCompletadaEn(LocalDateTime.now());
        pasoActivo.setCompletadaPor(usuario);
        etapaRepositorio.saveAndFlush(pasoActivo);

        RespuestaFormulario rf = new RespuestaFormulario();
        rf.setFormulario(pasoActivo.getFormulario());
        rf.setUsuario(usuario);
        rf.setRespuestaJson(json);
        rf.setEtapaTareaCampo(pasoActivo);
        respuestaRepositorio.save(rf);

        List<EtapaTareaCampo> etapasActualizadas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tareaId);
        boolean quedan = etapasActualizadas.stream()
                .anyMatch(e -> !Boolean.TRUE.equals(e.getCompletada()));
        if (!quedan) {
            TareaCampo tareaPersist = tareaRepositorio.findById(tareaId)
                    .orElseThrow(() -> new RuntimeException("Actividad no encontrada"));
            EstadoTareaCampo ant = tareaPersist.getEstado();
            tareaPersist.setEstado(EstadoTareaCampo.TERMINADA);
            tareaRepositorio.saveAndFlush(tareaPersist);
            HistorialTareaCampo h = new HistorialTareaCampo();
            h.setTarea(tareaPersist);
            h.setEstadoAnterior(ant);
            h.setEstadoNuevo(EstadoTareaCampo.TERMINADA);
            h.setComentario("Flujo completado: todos los pasos finalizados");
            h.setUsuario(usuario);
            historialRepositorio.save(h);
        } else {
            TareaCampo tareaViva = tareaRepositorio.findById(tareaId).orElse(tarea);
            HistorialTareaCampo h = new HistorialTareaCampo();
            h.setTarea(tareaViva);
            h.setEstadoAnterior(tareaViva.getEstado());
            h.setEstadoNuevo(tareaViva.getEstado());
            h.setComentario("Paso completado: " + pasoActivo.getNombre());
            h.setUsuario(usuario);
            historialRepositorio.save(h);
        }

        return tareaRepositorio.findById(tareaId).orElse(tarea);
    }

    public EtapaTareaCampo obtenerPasoActivo(Long tareaId) {
        tareaRepositorio.findById(tareaId).orElseThrow(() -> new RuntimeException("Actividad no encontrada"));
        return pasoActivo(etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tareaId));
    }

    // =====================================================
    // INTERNOS
    // =====================================================

    private TareaCampo clonarEjecucion(TareaCampo plantilla, String tituloEjecucion, Usuario asignadoA, Usuario creadoPor) {
        List<EtapaTareaCampo> src = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(plantilla.getId());
        if (src.isEmpty()) {
            throw new RuntimeException("La plantilla no tiene pasos");
        }

        TareaCampo inst = new TareaCampo();
        inst.setTitulo(tituloEjecucion);
        inst.setDescripcion(plantilla.getDescripcion());
        inst.setEstado(EstadoTareaCampo.EN_PROCESO);
        inst.setEsPlantillaFlujo(false);
        inst.setPlantillaFlujo(plantilla);
        inst.setSeccionPanel(plantilla.getSeccionPanel());
        inst.setMenuInicioRol(plantilla.getMenuInicioRol());
        inst.setCreadoPor(creadoPor);
        inst.setAsignadoA(asignadoA);
        FormularioDinamico primero = src.get(0).getFormulario();
        inst.setFormulario(primero);
        inst = tareaRepositorio.save(inst);

        for (EtapaTareaCampo e : src) {
            EtapaTareaCampo ne = new EtapaTareaCampo();
            ne.setTarea(inst);
            ne.setNombre(e.getNombre());
            ne.setOrden(e.getOrden());
            ne.setFormulario(e.getFormulario());
            ne.setRolResponsable(e.getRolResponsable());
            ne.setCompletada(false);
            etapaRepositorio.save(ne);
        }

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(inst);
        h.setEstadoAnterior(EstadoTareaCampo.EN_PROCESO);
        h.setEstadoNuevo(EstadoTareaCampo.EN_PROCESO);
        h.setComentario("Ejecucion de flujo iniciada");
        h.setUsuario(creadoPor);
        historialRepositorio.save(h);

        return tareaRepositorio.findById(inst.getId()).orElse(inst);
    }

    private void guardarEtapasDesdePeticion(TareaCampo tarea, List<PasoFlujoDefPeticion> pasos) {
        for (int i = 0; i < pasos.size(); i++) {
            PasoFlujoDefPeticion p = pasos.get(i);
            FormularioDinamico f = formularioRepositorio.findById(p.getFormularioId())
                    .orElseThrow(() -> new RuntimeException("Formulario no existe: " + p.getFormularioId()));
            EtapaTareaCampo e = new EtapaTareaCampo();
            e.setTarea(tarea);
            e.setNombre(p.getNombre().trim());
            e.setOrden(i + 1); // siempre secuencial 1, 2, 3...
            e.setFormulario(f);
            e.setRolResponsable(normalizarRol(p.getRolResponsable()));
            e.setCompletada(false);
            etapaRepositorio.save(e);
        }
    }

    /**
     * Normaliza el orden de los pasos: los ordena por su orden original (si lo tienen)
     * y luego les asigna posiciones secuenciales 1, 2, 3...
     */
    private List<PasoFlujoDefPeticion> normalizarOrdenPasos(List<PasoFlujoDefPeticion> pasos) {
        List<PasoFlujoDefPeticion> ordenados = new ArrayList<>(pasos);
        ordenados.sort(Comparator.comparing(p -> p.getOrden() != null ? p.getOrden() : Integer.MAX_VALUE));
        for (int i = 0; i < ordenados.size(); i++) {
            ordenados.get(i).setOrden(i + 1);
        }
        return ordenados;
    }

    private void validarPasosDefinicion(List<PasoFlujoDefPeticion> pasos) {
        for (PasoFlujoDefPeticion p : pasos) {
            if (p.getNombre() == null || p.getNombre().isBlank()) {
                throw new RuntimeException("Cada paso debe tener nombre");
            }
            if (p.getFormularioId() == null) {
                throw new RuntimeException("Cada paso debe tener formularioId");
            }
            normalizarRol(p.getRolResponsable());
        }
    }

    private void validarPasosPublicacion(List<EtapaTareaCampo> etapas) {
        if (etapas.isEmpty()) {
            throw new RuntimeException("No hay pasos en el flujo");
        }
        for (EtapaTareaCampo e : etapas) {
            if (e.getFormulario() == null || e.getRolResponsable() == null || e.getRolResponsable().isBlank()) {
                throw new RuntimeException("Cada paso debe tener formulario y rol responsable para publicar");
            }
        }
    }

    private String normalizarRol(String rol) {
        if (rol == null || rol.isBlank()) {
            throw new RuntimeException("rolResponsable es obligatorio en cada paso");
        }
        try {
            return RolNombre.valueOf(rol.trim().toUpperCase(Locale.ROOT)).name();
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Rol no valido: " + rol);
        }
    }

    private void validarTitulo(String titulo) {
        if (titulo == null || titulo.isBlank()) {
            throw new RuntimeException("El titulo del flujo es obligatorio");
        }
    }

    private TareaCampo buscarPlantilla(Long id) {
        TareaCampo t = tareaRepositorio.findById(id).orElseThrow(() -> new RuntimeException("Plantilla no encontrada"));
        if (!Boolean.TRUE.equals(t.getEsPlantillaFlujo())) {
            throw new RuntimeException("No es una plantilla de flujo");
        }
        return t;
    }

    private TareaCampo buscarPlantillaPublicada(Long id) {
        TareaCampo t = buscarPlantilla(id);
        if (t.getEstado() != EstadoTareaCampo.PUBLICADA) {
            throw new RuntimeException("La plantilla no esta publicada");
        }
        return t;
    }

    private SeccionPanelFlujo parseSeccion(String s) {
        if (s == null || s.isBlank()) {
            return SeccionPanelFlujo.OPERATIVOS;
        }
        try {
            return SeccionPanelFlujo.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return SeccionPanelFlujo.OPERATIVOS;
        }
    }

    private boolean esEjecucionConFlujoPorEtapas(TareaCampo t) {
        List<EtapaTareaCampo> et = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(t.getId());
        return et.stream().anyMatch(e -> e.getFormulario() != null
                && e.getRolResponsable() != null && !e.getRolResponsable().isBlank());
    }

    private EtapaTareaCampo pasoActivo(List<EtapaTareaCampo> etapas) {
        return etapas.stream()
                .sorted(Comparator.comparing(EtapaTareaCampo::getOrden))
                .filter(e -> !Boolean.TRUE.equals(e.getCompletada()))
                .findFirst()
                .orElse(null);
    }

    private boolean puedeActuarEnPasoActual(TareaCampo tarea, Usuario usuario) {
        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tarea.getId());
        EtapaTareaCampo paso = pasoActivo(etapas);
        if (paso == null) {
            return false;
        }
        return puedeUsuarioEjecutarPaso(tarea, paso, usuario);
    }

    /**
     * Determina si un usuario puede ejecutar un paso específico.
     *
     * REGLA CORREGIDA: En flujos con etapas multi-rol, `asignadoA` solo restringe
     * los pasos cuyo rol coincide con el del usuario asignado.
     * Para pasos de OTRO rol, cualquier usuario con ese rol puede actuar.
     *
     * Ejemplo: si asignadoA es técnico Juan, y el paso actual es para SUPERVISOR,
     * cualquier supervisor puede completarlo (no solo Juan).
     */
    private boolean puedeUsuarioEjecutarPaso(TareaCampo tarea, EtapaTareaCampo paso, Usuario usuario) {
        // El usuario debe tener el rol del paso
        if (!usuarioTieneRolNombre(usuario, paso.getRolResponsable())) {
            return false;
        }

        // Si hay un asignado específico, solo restringir cuando el paso es del mismo rol que el asignado
        if (tarea.getAsignadoA() != null) {
            boolean asignadoTieneRolDelPaso = usuarioTieneRolNombre(tarea.getAsignadoA(), paso.getRolResponsable());
            if (asignadoTieneRolDelPaso && !tarea.getAsignadoA().getId().equals(usuario.getId())) {
                // El asignado tiene el mismo rol que el paso, y este usuario no es el asignado
                return false;
            }
            // Si el asignado NO tiene el rol del paso, cualquier usuario con ese rol puede actuar
        }

        return true;
    }

    private boolean usuarioEsAdministrador(Usuario usuario) {
        return usuario.getRoles().stream().anyMatch(x -> x.getNombre() == RolNombre.ADMINISTRADOR);
    }

    private boolean usuarioTieneRolNombre(Usuario usuario, String rolNombre) {
        if (rolNombre == null || rolNombre.isBlank()) {
            return false;
        }
        try {
            RolNombre r = RolNombre.valueOf(rolNombre.trim().toUpperCase(Locale.ROOT));
            return usuario.getRoles().stream().anyMatch(x -> x.getNombre() == r);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean usuarioTieneInteresEnFlujoActivo(TareaCampo t, Usuario usuario) {
        if (t.getCreadoPor() != null && t.getCreadoPor().getId().equals(usuario.getId())) {
            return true;
        }
        if (t.getAsignadoA() != null && t.getAsignadoA().getId().equals(usuario.getId())) {
            return true;
        }
        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(t.getId());
        // El usuario participó en algún paso
        boolean participo = etapas.stream().anyMatch(e -> e.getCompletadaPor() != null
                && e.getCompletadaPor().getId().equals(usuario.getId()));
        if (participo) {
            return true;
        }
        // El usuario tiene el rol de algún paso futuro (verá el flujo en seguimiento)
        return etapas.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getCompletada()))
                .anyMatch(e -> usuarioTieneRolNombre(usuario, e.getRolResponsable()));
    }

    private boolean usuarioParticipoEnEjecucion(TareaCampo tarea, Usuario usuario) {
        if (tarea.getCreadoPor() != null && tarea.getCreadoPor().getId().equals(usuario.getId())) {
            return true;
        }
        if (tarea.getAsignadoA() != null && tarea.getAsignadoA().getId().equals(usuario.getId())) {
            return true;
        }
        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tarea.getId());
        return etapas.stream().anyMatch(e -> e.getCompletadaPor() != null
                && e.getCompletadaPor().getId().equals(usuario.getId()));
    }

    private boolean tieneFirmaValida(String respuestaJson) {
        try {
            JsonNode nodo = objectMapper.readTree(respuestaJson);
            String firma = nodo.path("firmaSistema").asText("");
            return firma.startsWith("data:image/");
        } catch (Exception e) {
            return false;
        }
    }
}
