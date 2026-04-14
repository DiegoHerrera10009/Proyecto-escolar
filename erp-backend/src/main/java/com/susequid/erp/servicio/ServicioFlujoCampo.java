package com.susequid.erp.servicio;

import com.susequid.erp.dto.CompletarPasoFlujoPeticion;
import com.susequid.erp.dto.CrearPermisoFlujoPeticion;
import com.susequid.erp.dto.CrearPedidoFlujoPeticion;
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
    private static final String TITULO_BASE_PEDIDOS = "Flujo de Pedido Comercial";
    private static final String NOMBRE_FORMULARIO_COMERCIAL_PEDIDOS = "FORM_PEDIDOS_COMERCIAL";
    private static final String NOMBRE_FORMULARIO_BODEGA_REVISION = "FORM_PEDIDOS_BODEGA_REVISION";
    private static final String NOMBRE_FORMULARIO_COMPRAS = "FORM_PEDIDOS_COMPRAS";
    private static final String NOMBRE_FORMULARIO_BODEGA_RECEPCION = "FORM_PEDIDOS_BODEGA_RECEPCION";
    private static final String NOMBRE_FORMULARIO_BODEGA_DESPACHO = "FORM_PEDIDOS_BODEGA_DESPACHO";
    private static final String ETAPA_COMERCIAL = "Comercial - Crear pedido";
    private static final String ETAPA_BODEGA_REVISION = "Bodega - Revisar inventario";
    private static final String ETAPA_COMPRAS = "Compras - Gestionar compra";
    private static final String ETAPA_BODEGA_RECEPCION = "Bodega - Registrar recepcion";
    private static final String ETAPA_BODEGA_DESPACHO = "Bodega - Despachar pedido";
    private static final String TITULO_BASE_PERMISO = "Solicitud de permiso laboral";
    private static final String NOMBRE_FORMULARIO_PERMISO_SOLICITUD = "FORM_PERMISO_SOLICITUD";
    private static final String NOMBRE_FORMULARIO_PERMISO_GH = "FORM_PERMISO_GESTION_HUMANA";
    private static final String ETAPA_PERMISO_SOLICITUD = "Solicitante - Registrar permiso";
    private static final String ETAPA_PERMISO_APROBACION = "Gestion humana - Aprobar permiso";
    private static final String TITULO_BASE_PREOPERACIONAL = "Preoperacional de vehiculo";
    private static final String NOMBRE_FORMULARIO_PREOPERACIONAL_VEHICULO = "FORM_PREOPERACIONAL_VEHICULO";
    private static final String ETAPA_PREOPERACIONAL_TECNICO = "Tecnico - Diligenciar preoperacional";

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

    @Transactional
    public TareaCampo iniciarFlujoPedido(CrearPedidoFlujoPeticion peticion, Usuario comercial) {
        if (!usuarioTieneRolNombre(comercial, RolNombre.COMERCIAL.name()) && !usuarioEsAdministrador(comercial)) {
            throw new RuntimeException("Solo Comercial o Administrador puede crear pedidos");
        }
        if (peticion == null || peticion.getProductos() == null || peticion.getProductos().isEmpty()) {
            throw new RuntimeException("El pedido debe incluir al menos un producto");
        }
        if (peticion.getProductos().stream().anyMatch(p -> p == null || p.isBlank())) {
            throw new RuntimeException("Todos los productos del pedido deben tener nombre");
        }

        FormularioDinamico formularioComercial = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_COMERCIAL_PEDIDOS,
                "{\"campos\":[{\"nombre\":\"pedidoCreado\",\"etiqueta\":\"Pedido creado\",\"tipo\":\"string\"}]}"
        );
        FormularioDinamico formularioBodegaRevision = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_BODEGA_REVISION,
                "{\"campos\":[" +
                        "{\"nombre\":\"inventarioCompleto\",\"etiqueta\":\"Inventario completo\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"productosFaltantes\",\"etiqueta\":\"Productos faltantes (si aplica)\",\"tipo\":\"string\"}" +
                        "]}"
        );
        FormularioDinamico formularioCompras = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_COMPRAS,
                "{\"campos\":[" +
                        "{\"nombre\":\"cotizacionesSolicitadas\",\"etiqueta\":\"Cotizaciones solicitadas\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"ordenCompraGenerada\",\"etiqueta\":\"Orden de compra generada\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"compraRealizada\",\"etiqueta\":\"Compra realizada\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}" +
                        "]}"
        );
        FormularioDinamico formularioBodegaRecepcion = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_BODEGA_RECEPCION,
                "{\"campos\":[" +
                        "{\"nombre\":\"productosRecibidos\",\"etiqueta\":\"Productos recibidos en bodega\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}" +
                        "]}"
        );
        FormularioDinamico formularioBodegaDespacho = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_BODEGA_DESPACHO,
                "{\"campos\":[" +
                        "{\"nombre\":\"despachoRealizado\",\"etiqueta\":\"Despacho realizado\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"observacionDespacho\",\"etiqueta\":\"Observación despacho\",\"tipo\":\"string\"}" +
                        "]}"
        );
        TareaCampo ejecucion = new TareaCampo();
        String titulo = (peticion.getTitulo() != null && !peticion.getTitulo().isBlank())
                ? peticion.getTitulo().trim()
                : TITULO_BASE_PEDIDOS + " - " + LocalDateTime.now().toLocalDate();
        String descripcion = (peticion.getDescripcion() != null ? peticion.getDescripcion().trim() : "");
        String descripcionProductos = "Productos:\n" + peticion.getProductos().stream()
                .map(String::trim)
                .filter(p -> !p.isBlank())
                .collect(Collectors.joining("\n"));
        ejecucion.setTitulo(titulo);
        ejecucion.setDescripcion(descripcion.isBlank()
                ? descripcionProductos
                : descripcion + "\n\n" + descripcionProductos);
        ejecucion.setEstado(EstadoTareaCampo.EN_PROCESO);
        ejecucion.setEsPlantillaFlujo(false);
        ejecucion.setSeccionPanel(SeccionPanelFlujo.OPERATIVOS);
        ejecucion.setMenuInicioRol(RolNombre.COMERCIAL.name());
        ejecucion.setVisibleEnMenuFlujo(false);
        ejecucion.setCreadoPor(comercial);
        ejecucion.setFormulario(formularioComercial);
        ejecucion = tareaRepositorio.save(ejecucion);

        // Se guarda todo el flujo en código. La etapa Comercial queda cerrada al crear el pedido.
        String productosJson = peticion.getProductos().stream()
                .map(p -> "\"" + p.replace("\"", "\\\"") + "\"")
                .collect(Collectors.joining(","));
        crearEtapaPedido(ejecucion, formularioComercial, ETAPA_COMERCIAL, 1, RolNombre.COMERCIAL.name(), true, comercial,
                "{\"pedidoCreado\":true,\"productos\":[" + productosJson + "]}");
        crearEtapaPedido(ejecucion, formularioBodegaRevision, ETAPA_BODEGA_REVISION, 2, RolNombre.BODEGA.name(), false, null, null);
        crearEtapaPedido(ejecucion, formularioCompras, ETAPA_COMPRAS, 3, RolNombre.COMPRAS.name(), false, null, null);
        crearEtapaPedido(ejecucion, formularioBodegaRecepcion, ETAPA_BODEGA_RECEPCION, 4, RolNombre.BODEGA.name(), false, null, null);
        crearEtapaPedido(ejecucion, formularioBodegaDespacho, ETAPA_BODEGA_DESPACHO, 5, RolNombre.BODEGA.name(), false, null, null);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(ejecucion);
        h.setEstadoAnterior(EstadoTareaCampo.EN_PROCESO);
        h.setEstadoNuevo(EstadoTareaCampo.EN_PROCESO);
        h.setComentario("Pedido creado por Comercial. Flujo enviado a Bodega para revision de inventario");
        h.setUsuario(comercial);
        historialRepositorio.save(h);

        return tareaRepositorio.findById(ejecucion.getId()).orElse(ejecucion);
    }

    @Transactional
    public TareaCampo iniciarFlujoPermiso(CrearPermisoFlujoPeticion peticion, Usuario solicitante) {
        if (peticion == null) {
            throw new RuntimeException("La solicitud de permiso es obligatoria");
        }
        String motivo = peticion.getMotivo() != null ? peticion.getMotivo().trim() : "";
        if (motivo.isBlank()) {
            throw new RuntimeException("El motivo del permiso es obligatorio");
        }
        String nombresApellidos = peticion.getNombresApellidos() != null ? peticion.getNombresApellidos().trim() : "";
        if (nombresApellidos.isBlank()) {
            throw new RuntimeException("Nombres y apellidos son obligatorios");
        }
        String cedula = peticion.getCedula() != null ? peticion.getCedula().trim() : "";
        if (cedula.isBlank()) {
            throw new RuntimeException("La cédula es obligatoria");
        }
        String soporteDescripcion = peticion.getSoporteDescripcion() != null ? peticion.getSoporteDescripcion().trim() : "";
        String soporteAdjuntoNombre = peticion.getSoporteAdjuntoNombre() != null ? peticion.getSoporteAdjuntoNombre().trim() : "";
        String soporteAdjuntoDataUrl = peticion.getSoporteAdjuntoDataUrl() != null ? peticion.getSoporteAdjuntoDataUrl().trim() : "";
        String tipoPermiso = peticion.getTipoPermiso() != null ? peticion.getTipoPermiso().trim().toUpperCase(Locale.ROOT) : "DIAS";
        if (!"DIAS".equals(tipoPermiso) && !"HORAS".equals(tipoPermiso)) {
            throw new RuntimeException("tipoPermiso debe ser DIAS u HORAS");
        }

        FormularioDinamico formSolicitud = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_PERMISO_SOLICITUD,
                "{\"campos\":[" +
                        "{\"nombre\":\"nombresApellidos\",\"etiqueta\":\"Nombres y apellidos\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"cedula\",\"etiqueta\":\"Cedula\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"tipoPermiso\",\"etiqueta\":\"Tipo de permiso\",\"tipo\":\"select\",\"opciones\":[\"DIAS\",\"HORAS\"]}," +
                        "{\"nombre\":\"fechaDesde\",\"etiqueta\":\"Desde la fecha\",\"tipo\":\"fecha\"}," +
                        "{\"nombre\":\"fechaHasta\",\"etiqueta\":\"Hasta la fecha\",\"tipo\":\"fecha\"}," +
                        "{\"nombre\":\"horaDesde\",\"etiqueta\":\"Desde hora\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"horaHasta\",\"etiqueta\":\"Hasta hora\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"fechaPermiso\",\"etiqueta\":\"Fecha del permiso\",\"tipo\":\"fecha\"}," +
                        "{\"nombre\":\"motivo\",\"etiqueta\":\"Motivo\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"soporteDescripcion\",\"etiqueta\":\"Soporte descripcion\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"soporteAdjuntoNombre\",\"etiqueta\":\"Soporte adjunto nombre\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"soporteAdjuntoDataUrl\",\"etiqueta\":\"Soporte adjunto\",\"tipo\":\"string\"}" +
                        "]}"
        );
        FormularioDinamico formAprobacionGh = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_PERMISO_GH,
                "{\"campos\":[" +
                        "{\"nombre\":\"autorizado\",\"etiqueta\":\"Autorizado\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"permisoRemunerado\",\"etiqueta\":\"Permiso remunerado\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"observaciones\",\"etiqueta\":\"Observaciones\",\"tipo\":\"string\"}" +
                        "]}"
        );

        TareaCampo ejecucion = new TareaCampo();
        String titulo = (peticion.getTitulo() != null && !peticion.getTitulo().isBlank())
                ? peticion.getTitulo().trim()
                : TITULO_BASE_PERMISO + " - " + LocalDateTime.now().toLocalDate();
        String descripcion = "Tipo: " + tipoPermiso + " | Motivo: " + motivo;
        ejecucion.setTitulo(titulo);
        ejecucion.setDescripcion(descripcion);
        ejecucion.setEstado(EstadoTareaCampo.EN_PROCESO);
        ejecucion.setEsPlantillaFlujo(false);
        ejecucion.setSeccionPanel(SeccionPanelFlujo.OPERATIVOS);
        ejecucion.setMenuInicioRol(RolNombre.ADMINISTRADOR.name());
        ejecucion.setVisibleEnMenuFlujo(false);
        ejecucion.setCreadoPor(solicitante);
        ejecucion.setFormulario(formSolicitud);
        ejecucion = tareaRepositorio.save(ejecucion);

        String rolSolicitante = rolPrincipalParaFlujo(solicitante);
        String respuestaSolicitud = String.format(
                Locale.ROOT,
                "{\"nombresApellidos\":\"%s\",\"cedula\":\"%s\",\"tipoPermiso\":\"%s\",\"fechaDesde\":\"%s\",\"fechaHasta\":\"%s\",\"horaDesde\":\"%s\",\"horaHasta\":\"%s\",\"fechaPermiso\":\"%s\",\"motivo\":\"%s\",\"soporteDescripcion\":\"%s\",\"soporteAdjuntoNombre\":\"%s\",\"soporteAdjuntoDataUrl\":\"%s\"}",
                escaparJson(nombresApellidos),
                escaparJson(cedula),
                escaparJson(tipoPermiso),
                escaparJson(valorSeguro(peticion.getFechaDesde())),
                escaparJson(valorSeguro(peticion.getFechaHasta())),
                escaparJson(valorSeguro(peticion.getHoraDesde())),
                escaparJson(valorSeguro(peticion.getHoraHasta())),
                escaparJson(valorSeguro(peticion.getFechaPermiso())),
                escaparJson(motivo),
                escaparJson(soporteDescripcion),
                escaparJson(soporteAdjuntoNombre),
                escaparJson(soporteAdjuntoDataUrl)
        );
        crearEtapaPedido(ejecucion, formSolicitud, ETAPA_PERMISO_SOLICITUD, 1, rolSolicitante, true, solicitante, respuestaSolicitud);
        crearEtapaPedido(ejecucion, formAprobacionGh, ETAPA_PERMISO_APROBACION, 2, RolNombre.GESTION_HUMANA.name(), false, null, null);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(ejecucion);
        h.setEstadoAnterior(EstadoTareaCampo.EN_PROCESO);
        h.setEstadoNuevo(EstadoTareaCampo.EN_PROCESO);
        h.setComentario("Permiso registrado por solicitante. Pendiente aprobacion de Gestion Humana");
        h.setUsuario(solicitante);
        historialRepositorio.save(h);

        return tareaRepositorio.findById(ejecucion.getId()).orElse(ejecucion);
    }

    @Transactional
    public TareaCampo iniciarFlujoPreoperacionalVehiculo(Usuario tecnico) {
        FormularioDinamico formPreoperacional = obtenerOCrearFormularioPedido(
                NOMBRE_FORMULARIO_PREOPERACIONAL_VEHICULO,
                "{\"campos\":[" +
                        "{\"nombre\":\"fechaRevision\",\"etiqueta\":\"Fecha de revision\",\"tipo\":\"fecha\"}," +
                        "{\"nombre\":\"placa\",\"etiqueta\":\"Placa del vehiculo\",\"tipo\":\"string\"}," +
                        "{\"nombre\":\"kilometraje\",\"etiqueta\":\"Kilometraje actual\",\"tipo\":\"int\"}," +
                        "{\"nombre\":\"nivelCombustible\",\"etiqueta\":\"Nivel de combustible\",\"tipo\":\"select\",\"opciones\":[\"RESERVA\",\"1/4\",\"1/2\",\"3/4\",\"LLENO\"]}," +
                        "{\"nombre\":\"lucesOperativas\",\"etiqueta\":\"Luces operativas\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"frenosOperativos\",\"etiqueta\":\"Frenos operativos\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"llantasBuenEstado\",\"etiqueta\":\"Llantas en buen estado\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"botiquinExtintor\",\"etiqueta\":\"Botiquin y extintor vigentes\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"documentosAlDia\",\"etiqueta\":\"Documentos al dia\",\"tipo\":\"select\",\"opciones\":[\"SI\",\"NO\"]}," +
                        "{\"nombre\":\"observaciones\",\"etiqueta\":\"Observaciones\",\"tipo\":\"string\"}" +
                        "]}"
        );

        TareaCampo ejecucion = new TareaCampo();
        ejecucion.setTitulo(TITULO_BASE_PREOPERACIONAL + " - " + LocalDateTime.now().toLocalDate());
        ejecucion.setDescripcion("Checklist de seguridad y operacion antes de salida");
        ejecucion.setEstado(EstadoTareaCampo.EN_PROCESO);
        ejecucion.setEsPlantillaFlujo(false);
        ejecucion.setSeccionPanel(SeccionPanelFlujo.FLOTA);
        ejecucion.setMenuInicioRol(RolNombre.TECNICO.name());
        ejecucion.setVisibleEnMenuFlujo(false);
        ejecucion.setCreadoPor(tecnico);
        ejecucion.setFormulario(formPreoperacional);
        ejecucion = tareaRepositorio.save(ejecucion);

        crearEtapaPedido(ejecucion, formPreoperacional, ETAPA_PREOPERACIONAL_TECNICO, 1, RolNombre.TECNICO.name(), false, null, null);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(ejecucion);
        h.setEstadoAnterior(EstadoTareaCampo.EN_PROCESO);
        h.setEstadoNuevo(EstadoTareaCampo.EN_PROCESO);
        h.setComentario("Preoperacional de vehiculo creado. Pendiente diligenciamiento por Tecnico");
        h.setUsuario(tecnico);
        historialRepositorio.save(h);

        return tareaRepositorio.findById(ejecucion.getId()).orElse(ejecucion);
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

    @Transactional
    public TareaCampo cancelarEjecucionPorCreador(Long tareaId, Usuario solicitante, String motivo) {
        TareaCampo tarea = tareaRepositorio.findById(tareaId)
                .orElseThrow(() -> new RuntimeException("Ejecucion no encontrada"));
        if (Boolean.TRUE.equals(tarea.getEsPlantillaFlujo())) {
            throw new RuntimeException("No se puede cancelar una plantilla");
        }
        if (tarea.getEstado() == EstadoTareaCampo.TERMINADA || tarea.getEstado() == EstadoTareaCampo.CANCELADA) {
            throw new RuntimeException("La ejecucion ya finalizo");
        }
        if (tarea.getCreadoPor() == null || !tarea.getCreadoPor().getId().equals(solicitante.getId())) {
            throw new RuntimeException("Solo el usuario que inicio el flujo puede cancelarlo");
        }

        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tareaId);
        EtapaTareaCampo pasoActivo = etapas.stream().filter(e -> !Boolean.TRUE.equals(e.getCompletada())).findFirst().orElse(null);
        if (pasoActivo != null && pasoActivo.getOrden() >= 2) {
            throw new RuntimeException("No se puede cancelar: el flujo ya paso a su segunda etapa");
        }

        EstadoTareaCampo ant = tarea.getEstado();
        tarea.setEstado(EstadoTareaCampo.CANCELADA);
        tarea = tareaRepositorio.save(tarea);

        HistorialTareaCampo h = new HistorialTareaCampo();
        h.setTarea(tarea);
        h.setEstadoAnterior(ant);
        h.setEstadoNuevo(EstadoTareaCampo.CANCELADA);
        h.setComentario((motivo != null && !motivo.isBlank())
                ? motivo.trim()
                : "Cancelado por el usuario que inicio el flujo");
        h.setUsuario(solicitante);
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
        if (!tieneFirmaValida(json)) {
            throw new RuntimeException("La firma es obligatoria para completar el formulario");
        }

        boolean esFlujoPedido = esFlujoPedidoComercial(tarea);
        if (esFlujoPedido) {
            validarDatosPasoFlujoPedido(pasoActivo.getNombre(), json);
        }
        boolean requiereCompra = false;
        if (esFlujoPedido && ETAPA_BODEGA_REVISION.equals(pasoActivo.getNombre())) {
            requiereCompra = requiereCompraDesdeRevision(json);
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

        if (esFlujoPedido && ETAPA_BODEGA_REVISION.equals(pasoActivo.getNombre()) && !requiereCompra) {
            marcarEtapaSaltada(tareaId, ETAPA_COMPRAS, usuario,
                    "Etapa omitida: inventario completo, no se requiere compra");
            marcarEtapaSaltada(tareaId, ETAPA_BODEGA_RECEPCION, usuario,
                    "Etapa omitida: no hubo proceso de compras para recepcion");
            marcarEtapaSaltada(tareaId, ETAPA_BODEGA_DESPACHO, usuario,
                    "Etapa omitida: pedido disponible completo, flujo finalizado en revision de bodega");
        }

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

    private EtapaTareaCampo crearEtapaPedido(
            TareaCampo tarea,
            FormularioDinamico formulario,
            String nombre,
            int orden,
            String rolResponsable,
            boolean completada,
            Usuario completadaPor,
            String respuestaJson
    ) {
        EtapaTareaCampo e = new EtapaTareaCampo();
        e.setTarea(tarea);
        e.setNombre(nombre);
        e.setOrden(orden);
        e.setFormulario(formulario);
        e.setRolResponsable(rolResponsable);
        e.setCompletada(completada);
        if (completada) {
            e.setCompletadaEn(LocalDateTime.now());
            e.setCompletadaPor(completadaPor);
            e.setRespuestaJson(respuestaJson != null ? respuestaJson : "{}");
        }
        return etapaRepositorio.save(e);
    }

    private FormularioDinamico obtenerOCrearFormularioPedido(String nombre, String esquemaJson) {
        return formularioRepositorio.findAll().stream()
                .filter(f -> nombre.equalsIgnoreCase(f.getNombre()))
                .findFirst()
                .orElseGet(() -> {
                    FormularioDinamico nuevo = new FormularioDinamico();
                    nuevo.setNombre(nombre);
                    nuevo.setEsquemaJson(esquemaJson);
                    return formularioRepositorio.save(nuevo);
                });
    }

    private boolean esFlujoPedidoComercial(TareaCampo tarea) {
        if (tarea == null || tarea.getTitulo() == null) {
            return false;
        }
        return tarea.getTitulo().startsWith(TITULO_BASE_PEDIDOS)
                || (tarea.getDescripcion() != null && tarea.getDescripcion().contains("Productos:"));
    }

    private boolean requiereCompraDesdeRevision(String respuestaJson) {
        try {
            JsonNode nodo = objectMapper.readTree(respuestaJson);
            if (!nodo.has("inventarioCompleto")) {
                throw new RuntimeException("Bodega debe indicar si el inventario esta completo");
            }
            boolean inventarioCompleto = valorBooleanoFlexible(nodo.path("inventarioCompleto"), true);
            if (inventarioCompleto) {
                return false;
            }
            String faltantes = nodo.path("productosFaltantes").asText("").trim();
            if (faltantes.isBlank()) {
                throw new RuntimeException("Si faltan productos, Bodega debe especificar productosFaltantes");
            }
            return true;
        } catch (Exception ex) {
            if (ex instanceof RuntimeException) {
                throw (RuntimeException) ex;
            }
            throw new RuntimeException("Respuesta de bodega invalida: se esperaba JSON con disponibilidad de inventario");
        }
    }

    private void validarDatosPasoFlujoPedido(String nombreEtapa, String respuestaJson) {
        try {
            JsonNode nodo = objectMapper.readTree(respuestaJson);
            if (ETAPA_BODEGA_REVISION.equals(nombreEtapa)) {
                requiereCompraDesdeRevision(respuestaJson);
                return;
            }
            if (ETAPA_COMPRAS.equals(nombreEtapa)) {
                if (!valorBooleanoFlexible(nodo.path("cotizacionesSolicitadas"), false)
                        || !valorBooleanoFlexible(nodo.path("ordenCompraGenerada"), false)
                        || !valorBooleanoFlexible(nodo.path("compraRealizada"), false)) {
                    throw new RuntimeException("Compras debe completar cotizaciones, orden de compra y compra realizada");
                }
                return;
            }
            if (ETAPA_BODEGA_RECEPCION.equals(nombreEtapa)) {
                if (!valorBooleanoFlexible(nodo.path("productosRecibidos"), false)) {
                    throw new RuntimeException("Bodega debe confirmar productosRecibidos para continuar");
                }
                return;
            }
            if (ETAPA_BODEGA_DESPACHO.equals(nombreEtapa)
                    && !valorBooleanoFlexible(nodo.path("despachoRealizado"), false)) {
                throw new RuntimeException("Debe confirmar despachoRealizado para terminar el flujo");
            }
        } catch (Exception ex) {
            if (ex instanceof RuntimeException) {
                throw (RuntimeException) ex;
            }
            throw new RuntimeException("Respuesta invalida para la etapa " + nombreEtapa);
        }
    }

    private boolean valorBooleanoFlexible(JsonNode nodo, boolean valorPorDefecto) {
        if (nodo == null || nodo.isMissingNode() || nodo.isNull()) {
            return valorPorDefecto;
        }
        if (nodo.isBoolean()) {
            return nodo.asBoolean();
        }
        String texto = nodo.asText("").trim().toUpperCase(Locale.ROOT);
        if (texto.isBlank()) {
            return valorPorDefecto;
        }
        return "TRUE".equals(texto) || "SI".equals(texto) || "SÍ".equals(texto) || "1".equals(texto);
    }

    private String rolPrincipalParaFlujo(Usuario usuario) {
        if (usuario == null || usuario.getRoles() == null || usuario.getRoles().isEmpty()) {
            return RolNombre.ADMINISTRADOR.name();
        }
        if (usuarioTieneRolNombre(usuario, RolNombre.COMERCIAL.name())) return RolNombre.COMERCIAL.name();
        if (usuarioTieneRolNombre(usuario, RolNombre.COMPRAS.name())) return RolNombre.COMPRAS.name();
        if (usuarioTieneRolNombre(usuario, RolNombre.BODEGA.name())) return RolNombre.BODEGA.name();
        if (usuarioTieneRolNombre(usuario, RolNombre.TECNICO.name())) return RolNombre.TECNICO.name();
        if (usuarioTieneRolNombre(usuario, RolNombre.SUPERVISOR.name())) return RolNombre.SUPERVISOR.name();
        if (usuarioTieneRolNombre(usuario, RolNombre.HSEQ.name())) return RolNombre.HSEQ.name();
        if (usuarioTieneRolNombre(usuario, RolNombre.GESTION_HUMANA.name())) return RolNombre.GESTION_HUMANA.name();
        return RolNombre.ADMINISTRADOR.name();
    }

    private String valorSeguro(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private String escaparJson(String valor) {
        return valor.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void marcarEtapaSaltada(Long tareaId, String nombreEtapa, Usuario usuario, String comentario) {
        List<EtapaTareaCampo> etapas = etapaRepositorio.findByTarea_IdOrderByOrdenAsc(tareaId);
        for (EtapaTareaCampo etapa : etapas) {
            if (nombreEtapa.equals(etapa.getNombre()) && !Boolean.TRUE.equals(etapa.getCompletada())) {
                etapa.setCompletada(true);
                etapa.setCompletadaEn(LocalDateTime.now());
                etapa.setCompletadaPor(usuario);
                etapa.setRespuestaJson("{\"saltada\":true}");
                etapaRepositorio.save(etapa);

                TareaCampo tareaViva = etapa.getTarea();
                HistorialTareaCampo h = new HistorialTareaCampo();
                h.setTarea(tareaViva);
                h.setEstadoAnterior(tareaViva.getEstado());
                h.setEstadoNuevo(tareaViva.getEstado());
                h.setComentario(comentario);
                h.setUsuario(usuario);
                historialRepositorio.save(h);
            }
        }
    }
}
