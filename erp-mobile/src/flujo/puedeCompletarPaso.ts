import type { EtapaTareaCampoDto } from '../types/campo'

/** Alineado con `usuarioTieneRolNombre` en ServicioFlujoCampo (paso.rolResponsable). */
export function usuarioTieneRolParaPaso(rolesUsuario: string[], rolResponsable: string | null | undefined): boolean {
  if (!rolResponsable || !String(rolResponsable).trim()) return false
  const r = String(rolResponsable).trim().toUpperCase()
  return rolesUsuario.some((x) => String(x).trim().toUpperCase() === r)
}

/** Si el usuario no tiene el rol del paso activo, no debe enviar completar (evita «No tiene turno para este paso»). */
export function puedeCompletarPasoActivo(rolesUsuario: string[], paso: EtapaTareaCampoDto | null): boolean {
  if (!paso?.id || paso.completada) return false
  return usuarioTieneRolParaPaso(rolesUsuario, paso.rolResponsable)
}
