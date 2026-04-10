import * as XLSX from 'xlsx'

function normalizarHeader(c) {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Evita usar columnas claramente de fecha como código o descripción. */
function encabezadoSugiereFecha(headers, i) {
  const h = normalizarHeader(headers[i] ?? '')
  return /\b(fecha|date|vencimiento|desde|hasta|vto\.?|alta|baja|emis|elaboracion|elaboración)\b/i.test(h)
}

/**
 * Columnas de actas / RR.HH. que no son el nombre del bien (no usar como descripción del ítem).
 */
function encabezadoEsMetaOperativoNoDescripcion(headers, i) {
  const t = normalizarHeader(headers[i] ?? '')
  if (/\bentregado\b/.test(t) && /\bpor\b/.test(t) && !/\belementos\b/.test(t)) return true
  if (/\b(cargo|puesto|funcion|función)\b/.test(t) && !/\b(codigo|serial)\b/.test(t)) return true
  return false
}

function coincideUnaClave(hCompact, kk) {
  if (!kk) return false
  if (hCompact === kk) return true
  if (kk.length >= 4 && hCompact.includes(kk)) return true
  if (kk.length >= 3 && hCompact.startsWith(kk)) return true
  return false
}

/**
 * Recorre las claves en orden (más específicas primero) y devuelve la primera columna que coincida.
 */
function indicePrimeraColumnaPorClavesOrdenadas(headers, ordenClaves, excluirIndices, saltarEncabezadoExtra) {
  const ex = excluirIndices instanceof Set ? excluirIndices : new Set()
  for (const k of ordenClaves) {
    const kk = String(k).replace(/\s+/g, '')
    if (!kk) continue
    for (let i = 0; i < headers.length; i++) {
      if (ex.has(i)) continue
      if (encabezadoSugiereFecha(headers, i)) continue
      if (saltarEncabezadoExtra && saltarEncabezadoExtra(headers, i)) continue
      const h = normalizarHeader(headers[i]).replace(/\s+/g, '')
      if (coincideUnaClave(h, kk)) return i
    }
  }
  return -1
}

/** Descripción del bien: «elementos entregados» antes que «nombre» (empleado). */
const CLAVES_DESCRIPCION_PRIORIDAD = [
  'elementosentregados',
  'elementos',
  'bienes',
  'dotacion',
  'dotación',
  'equipamiento',
  'descripcion',
  'articulo',
  'detalle',
  'observacion',
  'concepto',
  'producto',
  'titulo',
  'denominacion',
  'nombre',
]

const CLAVES_CODIGO_PRIORIDAD = [
  'identificacion',
  'documento',
  'cedula',
  'dni',
  'nit',
  'codigo',
  'code',
  'sku',
  'referencia',
  'idproducto',
  'serial',
  'imei',
  'plu',
  'ean',
  'upc',
  'interno',
  'nro',
  'numero',
  'num',
  'item',
  'ref',
]

const CLAVES_RESPONSABLE = [
  'nombre',
  'empleado',
  'empleados',
  'trabajador',
  'funcionario',
  'responsable',
  'asignado',
  'titular',
]

const CLAVES_UBICACION = [
  'areadetrabajo',
  'ubicacion',
  'localizacion',
  'departamento',
  'sede',
  'oficina',
  'brigada',
  'zona',
  'area',
]

const CLAVES_EXISTENCIAS = ['existencias', 'cantidad', 'stock', 'qty', 'unidades', 'disponible']

function mapearIndicesCabecera(row0) {
  const headers = Array.isArray(row0) ? row0 : []

  const di = indicePrimeraColumnaPorClavesOrdenadas(
    headers,
    CLAVES_DESCRIPCION_PRIORIDAD,
    new Set(),
    encabezadoEsMetaOperativoNoDescripcion,
  )

  const exTrasDi = new Set()
  if (di >= 0) exTrasDi.add(di)

  const ci = indicePrimeraColumnaPorClavesOrdenadas(headers, CLAVES_CODIGO_PRIORIDAD, exTrasDi, null)

  const exTrasCi = new Set(exTrasDi)
  if (ci >= 0) exTrasCi.add(ci)

  const ri = indicePrimeraColumnaPorClavesOrdenadas(headers, CLAVES_RESPONSABLE, exTrasCi, null)

  const exTrasRi = new Set(exTrasCi)
  if (ri >= 0) exTrasRi.add(ri)

  const ui = indicePrimeraColumnaPorClavesOrdenadas(headers, CLAVES_UBICACION, exTrasRi, null)

  const exTrasUi = new Set(exTrasRi)
  if (ui >= 0) exTrasUi.add(ui)

  let ei = indicePrimeraColumnaPorClavesOrdenadas(headers, CLAVES_EXISTENCIAS, exTrasUi, null)
  if (ei >= 0 && (ei === ci || ei === di)) ei = -1
  if (ei < 0 && headers.length >= 3) {
    for (let j = headers.length - 1; j >= 0; j--) {
      if (
        !exTrasUi.has(j) &&
        j !== ci &&
        j !== di &&
        !encabezadoSugiereFecha(headers, j)
      ) {
        ei = j
        break
      }
    }
  }
  if (ei < 0 && headers.length >= 3) ei = 2

  let ciF = ci
  let diF = di
  if (diF < 0) diF = headers.length > 1 ? 1 : 0
  if (ciF < 0) ciF = 0
  if (ciF === diF && headers.length > 1) diF = ciF === 0 ? 1 : 0

  return {
    ci: ciF,
    di: diF,
    ri,
    ui,
    ei,
    headers,
  }
}

/**
 * Busca en las primeras filas la que mejor parece una fila de títulos (código + descripción).
 */
function elegirFilaCabecera(rows, maxFilas = 8) {
  let mejor = null
  const lim = Math.min(maxFilas, rows.length)
  for (let r = 0; r < lim; r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    const noTodoVacio = row.some((c) => String(c ?? '').trim() !== '')
    if (!noTodoVacio) continue
    const map = mapearIndicesCabecera(row)
    if (map.ci < 0 || map.di < 0 || map.ci === map.di) continue
    let score = 3
    if (map.ei >= 0 && map.ei !== map.ci && map.ei !== map.di) score += 1
    if (map.ri >= 0) score += 0.5
    if (map.ui >= 0) score += 0.5
    if (encabezadoSugiereFecha(map.headers, map.di)) score -= 3
    const hc = normalizarHeader(map.headers[map.ci] || '')
    const hd = normalizarHeader(map.headers[map.di] || '')
    if (/\d{4}/.test(hc) || hc.length > 40) score -= 1
    if (/\d{4}/.test(hd) && !/articulo|producto|descripcion|elementos/i.test(hd)) score -= 1
    if (!mejor || score > mejor.score) mejor = { score, fila: r, map }
  }
  return mejor
}

function celdaPareceFecha(v) {
  if (v == null || v === '') return false
  if (v instanceof Date && !Number.isNaN(v.getTime())) return true
  if (typeof v === 'number' && Number.isFinite(v)) {
    const n = Math.floor(v)
    if (n >= 35000 && n <= 75000) return true
    return false
  }
  const s = String(v).trim()
  if (!s) return false
  if (/^\d{1,2}\s+de\s+/i.test(s)) return true
  if (/^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/.test(s)) return true
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true
  return false
}

function anchoMaxFilas(rows, start) {
  let w = 0
  for (let r = start; r < rows.length; r++) {
    const row = rows[r]
    if (Array.isArray(row) && row.length > w) w = row.length
  }
  return w
}

function resolverIndiceExistencias(ci, di, eiPreferido, wMax) {
  if (wMax <= 0) return 2
  if (
    eiPreferido >= 0 &&
    eiPreferido < wMax &&
    eiPreferido !== ci &&
    eiPreferido !== di
  ) {
    return eiPreferido
  }
  const candidatos = []
  for (let j = di + 1; j < wMax; j++) candidatos.push(j)
  for (let j = wMax - 1; j >= 0; j--) candidatos.push(j)
  for (let j = 0; j < wMax; j++) candidatos.push(j)
  for (const j of candidatos) {
    if (j !== ci && j !== di) return j
  }
  return Math.min(wMax - 1, Math.max(0, wMax - 1))
}

function refinarDescripcionSiColumnaEsFecha(rows, start, ci, di, ei, advertencias) {
  let curDi = di
  const maxW = Math.max(anchoMaxFilas(rows, start), curDi + 2)

  for (let intento = 0; intento < 8; intento++) {
    let n = 0
    let fechas = 0
    const lim = Math.min(start + 20, rows.length)
    for (let r = start; r < lim; r++) {
      const row = rows[r]
      if (!Array.isArray(row)) continue
      const v = row[curDi]
      if (v === '' || v == null) continue
      n++
      if (celdaPareceFecha(v)) fechas++
    }
    if (n === 0 || fechas / n < 0.45) {
      if (curDi !== di) {
        advertencias.push(
          `La columna ${di + 1} parecía ser de fechas; se usó la columna ${curDi + 1} como descripción del ítem.`,
        )
      }
      return { ci, di: curDi, ei }
    }

    let next = curDi + 1
    while (next < maxW && next === ci) next++
    if (next >= maxW) break
    curDi = next
  }

  if (curDi !== di) {
    advertencias.push(
      `La columna ${di + 1} parecía ser de fechas; se usó la columna ${curDi + 1} como descripción del ítem.`,
    )
  }
  return { ci, di: curDi, ei }
}

function parseExistencias(v) {
  if (v === '' || v === null || v === undefined) return 1
  const n = Number(String(v).replace(',', '.').trim())
  if (Number.isNaN(n) || n < 0) return null
  return Math.max(0, Math.floor(n))
}

/** Si la celda de cantidad no ayuda, toma el número inicial de «2 HIDROLAVADORA…» o «1 EQUIPO…». */
function parseExistenciasMejorada(vCelda, textoDescripcion) {
  const deCelda = parseExistencias(vCelda)
  if (deCelda !== null && deCelda !== 1) return deCelda
  const m = String(textoDescripcion ?? '')
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')[0]
    .match(/^(\d+)\s+/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (Number.isFinite(n) && n > 0 && n <= 999999) return n
  }
  return deCelda === null ? 1 : deCelda
}

function asegurarCodigosUnicosEnArchivo(filas) {
  const seen = new Set()
  for (const f of filas) {
    const base = String(f.codigo ?? '').trim()
    if (!base) continue
    let c = base
    let n = 1
    const up = () => c.toUpperCase()
    while (seen.has(up())) {
      n++
      c = `${base}-${n}`
    }
    seen.add(up())
    f.codigo = c
  }
}

/**
 * Lee .xlsx, .xls o .csv y devuelve { filas: [{ codigo, descripcion, existencias, responsable?, ubicacion? }], advertencias: string[] }
 */
export function parseArchivoInventarioHerramientas(file) {
  return new Promise((resolve, reject) => {
    const name = (file && file.name ? file.name : '').toLowerCase()
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = (e) => {
      try {
        let wb
        if (name.endsWith('.csv')) {
          wb = XLSX.read(String(e.target.result), { type: 'string', codepage: 65001 })
        } else {
          wb = XLSX.read(e.target.result, { type: 'array' })
        }
        const sh = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '', blankrows: false })
        if (!rows.length) {
          resolve({ filas: [], advertencias: ['El archivo no tiene filas'] })
          return
        }

        const advertencias = []
        let start = 0
        let ci = 0
        let di = 1
        let ei = 2
        let ri = -1
        let ui = -1

        const candidato = elegirFilaCabecera(rows)
        if (candidato && candidato.map.ci >= 0 && candidato.map.di >= 0) {
          ci = candidato.map.ci
          di = candidato.map.di
          ri = candidato.map.ri
          ui = candidato.map.ui
          ei = candidato.map.ei >= 0 ? candidato.map.ei : Math.min(2, (rows[candidato.fila]?.length ?? 3) - 1)
          if (ei < 0 || ei === ci || ei === di) {
            ei = 2
            const w = rows[candidato.fila]?.length ?? 0
            if (ei >= w || ei === ci || ei === di) {
              for (let j = 0; j < w; j++) {
                if (j !== ci && j !== di) {
                  ei = j
                  break
                }
              }
            }
          }
          start = candidato.fila + 1
        } else {
          const map = mapearIndicesCabecera(rows[0])
          const cabeceraPlausible = map.ci >= 0 && map.di >= 0 && map.ci !== map.di
          if (cabeceraPlausible) {
            ci = map.ci
            di = map.di
            ri = map.ri
            ui = map.ui
            ei = map.ei >= 0 ? map.ei : 2
            start = 1
          } else {
            ri = -1
            ui = -1
            advertencias.push(
              'No se detectaron títulos claros; se asume columna A = código. Si la B es una fecha, el sistema intentará usar la siguiente columna con texto como nombre del ítem.',
            )
          }
        }

        let wMax = anchoMaxFilas(rows, start)
        if (wMax < 3) wMax = 3

        const ref = refinarDescripcionSiColumnaEsFecha(rows, start, ci, di, ei, advertencias)
        ci = ref.ci
        di = ref.di
        ei = resolverIndiceExistencias(ci, di, ref.ei, wMax)

        const filas = []
        for (let r = start; r < rows.length; r++) {
          const row = rows[r]
          if (!Array.isArray(row)) continue
          const codigo = String(row[ci] ?? '').trim()
          const descripcion = String(row[di] ?? '').trim()
          const ext = parseExistenciasMejorada(row[ei], descripcion)
          const responsable = ri >= 0 ? String(row[ri] ?? '').trim() : ''
          const ubicacion = ui >= 0 ? String(row[ui] ?? '').trim() : ''
          if (!codigo && !descripcion) continue
          if (ext === null) {
            advertencias.push(`Fila ${r + 1}: existencias no válidas para código «${codigo || '?'}», se usará 1`)
            const f = { codigo, descripcion, existencias: 1 }
            if (responsable) f.responsable = responsable
            if (ubicacion) f.ubicacion = ubicacion
            filas.push(f)
            continue
          }
          const f = { codigo, descripcion, existencias: ext }
          if (responsable) f.responsable = responsable
          if (ubicacion) f.ubicacion = ubicacion
          filas.push(f)
        }

        asegurarCodigosUnicosEnArchivo(filas)

        resolve({ filas, advertencias })
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }

    if (name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}
