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

export function esComercial(roles: string[]): boolean {
  return roles.some((r) => String(r).toUpperCase() === 'COMERCIAL')
}

export function esBodega(roles: string[]): boolean {
  return roles.some((r) => String(r).toUpperCase() === 'BODEGA')
}

export function esCompras(roles: string[]): boolean {
  return roles.some((r) => String(r).toUpperCase() === 'COMPRAS')
}

/**
 * Operadores de flujo en campo (alineado con `esOperadorFlujo` en App.jsx): inicio = menú/actividades, sin panel admin.
 */
export function esVistaSoloPanelCampo(roles: string[]): boolean {
  if (esAdministrador(roles)) return false
  return (
    esTecnico(roles) ||
    esSupervisor(roles) ||
    esComercial(roles) ||
    esBodega(roles) ||
    esCompras(roles)
  )
}
