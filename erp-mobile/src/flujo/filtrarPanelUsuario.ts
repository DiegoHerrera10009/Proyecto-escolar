import type { SeccionMenu } from '../api/flujosCampo'
import type { TareaCampoResumen } from '../types/campo'

/** Misma lógica que `refrescarPanelFlujosUsuario` en App.jsx (pasaSeccion). */
export function pasaSeccionPanel(t: TareaCampoResumen, seccion: SeccionMenu): boolean {
  const s = String(t.seccionPanel ?? 'OPERATIVOS').toUpperCase()
  if (seccion === 'FLOTA') return s === 'FLOTA'
  return s !== 'FLOTA'
}

/** Plantillas visibles en menú según `menuInicioRol` (admin ve todo). */
export function menuVisibleParaMisRoles(
  plantilla: TareaCampoResumen,
  rolesUsuario: string[],
  esAdmin: boolean,
): boolean {
  if (esAdmin) return true
  const rol = String(plantilla.menuInicioRol ?? 'TECNICO').toUpperCase()
  const set = new Set(rolesUsuario.map((r) => r.toUpperCase()))
  return set.has(rol)
}

export function filtrarMenuFlujo(
  items: TareaCampoResumen[],
  rolesUsuario: string[],
  esAdmin: boolean,
  seccion: SeccionMenu,
): TareaCampoResumen[] {
  return items.filter((t) => pasaSeccionPanel(t, seccion) && menuVisibleParaMisRoles(t, rolesUsuario, esAdmin))
}

export function filtrarPorSeccion(items: TareaCampoResumen[], seccion: SeccionMenu): TareaCampoResumen[] {
  return items.filter((t) => pasaSeccionPanel(t, seccion))
}
