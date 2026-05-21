import { useLocalStorage } from './useLocalStorage'
import { CATALOGO_INICIAL } from '../utils/catalogo'
import { todayISO } from '../utils/formatters'

export function useSuper() {
  const [catalogo, setCatalogo] = useLocalStorage('ff_catalogo', CATALOGO_INICIAL)
  const [viajes, setViajes] = useLocalStorage('ff_viajes_super', [])

  // ── Catálogo ──────────────────────────────────────────────
  const addProducto = (nombre, precioRef = null) => {
    const nuevo = { id: crypto.randomUUID(), nombre: nombre.trim(), precioRef }
    setCatalogo((prev) => [...prev, nuevo])
    return nuevo
  }

  const updateProducto = (id, data) =>
    setCatalogo((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))

  const deleteProducto = (id) =>
    setCatalogo((prev) => prev.filter((p) => p.id !== id))

  // Update catalog reference price when user enters a real price in a trip
  const actualizarPrecioRef = (catalogoId, precio) => {
    if (!catalogoId) return
    setCatalogo((prev) =>
      prev.map((p) => (p.id === catalogoId ? { ...p, precioRef: precio } : p))
    )
  }

  // ── Viajes ────────────────────────────────────────────────
  const addViaje = ({ descripcion = '', fecha = todayISO() }) => {
    const nuevo = {
      id: crypto.randomUUID(),
      descripcion: descripcion.trim() || `Super ${formatFechaCorta(fecha)}`,
      fecha,
      items: [],
      createdAt: new Date().toISOString(),
    }
    setViajes((prev) => [nuevo, ...prev])
    return nuevo
  }

  const updateViaje = (id, data) =>
    setViajes((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)))

  const deleteViaje = (id) =>
    setViajes((prev) => prev.filter((v) => v.id !== id))

  // ── Items dentro de un viaje ─────────────────────────────
  const addItems = (viajeId, nuevosItems) => {
    setViajes((prev) =>
      prev.map((v) => {
        if (v.id !== viajeId) return v
        const existingIds = new Set(v.items.map((i) => i.catalogoId).filter(Boolean))
        const toAdd = nuevosItems.filter(
          (ni) => !ni.catalogoId || !existingIds.has(ni.catalogoId)
        )
        return { ...v, items: [...v.items, ...toAdd] }
      })
    )
  }

  const updateItem = (viajeId, itemId, data) => {
    setViajes((prev) =>
      prev.map((v) => {
        if (v.id !== viajeId) return v
        return {
          ...v,
          items: v.items.map((i) => (i.id === itemId ? { ...i, ...data } : i)),
        }
      })
    )
    // If price updated and item has catalogoId, update reference price
    if (data.precioUnitario && data.precioUnitario > 0) {
      const viaje = viajes.find((v) => v.id === viajeId)
      const item = viaje?.items.find((i) => i.id === itemId)
      if (item?.catalogoId) actualizarPrecioRef(item.catalogoId, data.precioUnitario)
    }
  }

  const removeItem = (viajeId, itemId) =>
    setViajes((prev) =>
      prev.map((v) => {
        if (v.id !== viajeId) return v
        return { ...v, items: v.items.filter((i) => i.id !== itemId) }
      })
    )

  const toggleItem = (viajeId, itemId) =>
    setViajes((prev) =>
      prev.map((v) => {
        if (v.id !== viajeId) return v
        return {
          ...v,
          items: v.items.map((i) =>
            i.id === itemId ? { ...i, checked: !i.checked } : i
          ),
        }
      })
    )

  const reordenarItems = (viajeId, fromIdx, toIdx) =>
    setViajes((prev) =>
      prev.map((v) => {
        if (v.id !== viajeId) return v
        const items = [...v.items]
        const [moved] = items.splice(fromIdx, 1)
        items.splice(toIdx, 0, moved)
        return { ...v, items }
      })
    )

  // ── Helpers ───────────────────────────────────────────────
  const getViaje = (id) => viajes.find((v) => v.id === id)

  const calcTotales = (viaje) => {
    if (!viaje) return { total: 0, totalCarrito: 0, totalPendiente: 0 }
    const total = viaje.items.reduce(
      (s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0),
      0
    )
    const totalCarrito = viaje.items
      .filter((i) => i.checked)
      .reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0), 0)
    return { total, totalCarrito, totalPendiente: total - totalCarrito }
  }

  const buildItemFromCatalogo = (producto) => ({
    id: crypto.randomUUID(),
    catalogoId: producto.id,
    nombre: producto.nombre,
    precioRef: producto.precioRef,
    cantidad: 1,
    precioUnitario: producto.precioRef ?? null,
    checked: false,
  })

  const buildItemManual = (nombre) => ({
    id: crypto.randomUUID(),
    catalogoId: null,
    nombre: nombre.trim(),
    precioRef: null,
    cantidad: 1,
    precioUnitario: null,
    checked: false,
  })

  return {
    catalogo,
    viajes,
    addProducto,
    updateProducto,
    deleteProducto,
    addViaje,
    updateViaje,
    deleteViaje,
    addItems,
    updateItem,
    removeItem,
    toggleItem,
    reordenarItems,
    getViaje,
    calcTotales,
    buildItemFromCatalogo,
    buildItemManual,
  }
}

function formatFechaCorta(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}
