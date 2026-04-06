export function esTecnico(roles: string[]): boolean {
  return roles.includes('TECNICO')
}

/** Alineado con el menú web: Inventario y Formularios ocultos si el usuario tiene rol TECNICO. */
export function mostrarInventarioYFormularios(roles: string[]): boolean {
  return !esTecnico(roles)
}

export function esAdministrador(roles: string[]): boolean {
  return roles.includes('ADMINISTRADOR')
}

export function esSupervisor(roles: string[]): boolean {
  return roles.includes('SUPERVISOR')
}

/**
 * Técnico o supervisor sin rol administrador: en la web solo ven el dashboard de menú / actividades (no el panel admin).
 */
export function esVistaSoloPanelCampo(roles: string[]): boolean {
  if (esAdministrador(roles)) return false
  return esTecnico(roles) || esSupervisor(roles)
}
