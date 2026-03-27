package com.susequid.erp.servicio;

import com.susequid.erp.entidad.BitacoraWorkflow;
import com.susequid.erp.entidad.EstadoWorkflow;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.entidad.WorkflowProceso;
import com.susequid.erp.repositorio.BitacoraWorkflowRepositorio;
import com.susequid.erp.repositorio.WorkflowProcesoRepositorio;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;

@Service
public class ServicioWorkflow {
    private final WorkflowProcesoRepositorio repositorio;
    private final BitacoraWorkflowRepositorio bitacoraRepositorio;

    private static final Map<EstadoWorkflow, EnumSet<EstadoWorkflow>> TRANSICIONES_PERMITIDAS = Map.of(
            EstadoWorkflow.PENDIENTE, EnumSet.of(EstadoWorkflow.EN_PROCESO, EstadoWorkflow.RECHAZADO),
            EstadoWorkflow.EN_PROCESO, EnumSet.of(EstadoWorkflow.COMPLETADO, EstadoWorkflow.RECHAZADO),
            EstadoWorkflow.COMPLETADO, EnumSet.noneOf(EstadoWorkflow.class),
            EstadoWorkflow.RECHAZADO, EnumSet.noneOf(EstadoWorkflow.class)
    );

    public ServicioWorkflow(WorkflowProcesoRepositorio repositorio, BitacoraWorkflowRepositorio bitacoraRepositorio) {
        this.repositorio = repositorio;
        this.bitacoraRepositorio = bitacoraRepositorio;
    }

    public List<WorkflowProceso> listar() {
        return repositorio.findAll();
    }

    public WorkflowProceso guardar(WorkflowProceso proceso) {
        if (proceso.getEstado() == null) {
            proceso.setEstado(EstadoWorkflow.PENDIENTE);
        }
        return repositorio.save(proceso);
    }

    public WorkflowProceso buscarPorId(Long id) {
        return repositorio.findById(id).orElseThrow(() -> new RuntimeException("Workflow no encontrado"));
    }

    public WorkflowProceso cambiarEstado(Long workflowId, EstadoWorkflow estadoNuevo, String comentario, Usuario usuario) {
        WorkflowProceso workflow = buscarPorId(workflowId);
        validarRolPorAreaDestino(workflow, usuario);

        EstadoWorkflow estadoAnterior = workflow.getEstado();
        if (!TRANSICIONES_PERMITIDAS.get(estadoAnterior).contains(estadoNuevo)) {
            throw new RuntimeException("Transicion de estado no permitida");
        }

        workflow.setEstado(estadoNuevo);
        WorkflowProceso actualizado = repositorio.save(workflow);

        BitacoraWorkflow bitacora = new BitacoraWorkflow();
        bitacora.setWorkflow(actualizado);
        bitacora.setEstadoAnterior(estadoAnterior);
        bitacora.setEstadoNuevo(estadoNuevo);
        bitacora.setComentario(comentario);
        bitacora.setUsuario(usuario);
        bitacoraRepositorio.save(bitacora);
        return actualizado;
    }

    public List<BitacoraWorkflow> listarBitacora(Long workflowId) {
        return bitacoraRepositorio.findByWorkflowIdOrderByFechaRegistroDesc(workflowId);
    }

    private void validarRolPorAreaDestino(WorkflowProceso workflow, Usuario usuario) {
        RolNombre rolDestino = mapearRolPorArea(workflow.getAreaDestino());
        boolean tieneRol = usuario.getRoles().stream().anyMatch(r -> r.getNombre() == RolNombre.ADMINISTRADOR || r.getNombre() == rolDestino);
        if (!tieneRol) {
            throw new RuntimeException("No tiene rol del area destino para mover este workflow");
        }
    }

    private RolNombre mapearRolPorArea(String area) {
        if (area == null) {
            return RolNombre.ADMINISTRADOR;
        }
        String normalizada = area.trim().toUpperCase();
        return switch (normalizada) {
            case "COMPRAS" -> RolNombre.COMPRAS;
            case "BODEGA" -> RolNombre.BODEGA;
            case "HSEQ" -> RolNombre.HSEQ;
            case "TECNICO", "TECNICOS", "TECNICA" -> RolNombre.TECNICO;
            default -> RolNombre.ADMINISTRADOR;
        };
    }
}
