export type EstadoTareaCampo =
  | 'BORRADOR'
  | 'PUBLICADA'
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'PENDIENTE_APROBACION'
  | 'TERMINADA'
  | 'CANCELADA'

export type TareaCampoResumen = {
  id: number
  titulo?: string | null
  descripcion?: string | null
  estado?: EstadoTareaCampo | null
  esPlantillaFlujo?: boolean | null
  /** OPERATIVOS | FLOTA — alineado con panel web */
  seccionPanel?: string | null
  /** Rol que puede iniciar el flujo desde Disponibles */
  menuInicioRol?: string | null
  asignadoA?: { id: number; nombreCompleto?: string | null; correo?: string | null } | null
  formulario?: { id: number; nombre?: string | null } | null
}

export type EtapaTareaCampoDto = {
  id: number
  nombre?: string | null
  orden?: number | null
  completada?: boolean | null
  formulario?: { id: number; nombre?: string | null } | null
}

export type HistorialTareaCampoDto = {
  id: number
  estadoAnterior?: EstadoTareaCampo | null
  estadoNuevo?: EstadoTareaCampo | null
  comentario?: string | null
  fechaRegistro?: string | null
  usuario?: { nombreCompleto?: string | null; correo?: string | null } | null
}
