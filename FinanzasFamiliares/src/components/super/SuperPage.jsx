import { useState } from 'react'
import { Plus, ShoppingCart, Trash2, ChevronRight, PackageCheck } from 'lucide-react'
import Modal from '../Modal'
import TripDetail from './TripDetail'
import { useSuper } from '../../hooks/useSuper'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { todayISO } from '../../utils/formatters'

export default function SuperPage() {
  const {
    catalogo,
    viajes,
    addViaje,
    deleteViaje,
    addItems,
    updateItem,
    removeItem,
    toggleItem,
    getViaje,
    calcTotales,
  } = useSuper()

  const [openTripId, setOpenTripId] = useState(null)
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [newForm, setNewForm] = useState({ descripcion: '', fecha: todayISO() })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleCreateTrip = (e) => {
    e.preventDefault()
    const viaje = addViaje(newForm)
    setShowNewTrip(false)
    setNewForm({ descripcion: '', fecha: todayISO() })
    setOpenTripId(viaje.id)
  }

  const handleDelete = (id) => {
    if (deleteConfirm === id) {
      deleteViaje(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 2500)
    }
  }

  // Detail view
  const openViaje = openTripId ? getViaje(openTripId) : null
  if (openViaje) {
    return (
      <TripDetail
        viaje={openViaje}
        catalogo={catalogo}
        calcTotales={calcTotales}
        onBack={() => setOpenTripId(null)}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onToggleItem={toggleItem}
        onAddItems={addItems}
      />
    )
  }

  // List view
  const sorted = [...viajes].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Compras Súper</h2>
          <p className="text-xs text-gray-400">{viajes.length} {viajes.length === 1 ? 'compra' : 'compras'} registradas</p>
        </div>
        <button
          onClick={() => setShowNewTrip(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={15} />
          Nueva compra
        </button>
      </div>

      {/* Trip cards */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🛒</p>
          <p className="text-sm font-medium">Sin compras registradas</p>
          <button
            onClick={() => setShowNewTrip(true)}
            className="mt-3 text-sm text-green-600 hover:underline font-medium"
          >
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((viaje) => {
            const { total, totalCarrito } = calcTotales(viaje)
            const checkedCount = viaje.items.filter((i) => i.checked).length
            const total_ = viaje.items.length
            const pct = total_ > 0 ? Math.round((checkedCount / total_) * 100) : 0

            return (
              <div
                key={viaje.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenTripId(viaje.id)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{viaje.descripcion}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(viaje.fecha)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">{formatCurrency(total)}</p>
                      {totalCarrito > 0 && total > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          carrito: {formatCurrency(totalCarrito)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {total_ > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {checkedCount}/{total_} productos
                        </span>
                        <span className={`text-xs font-medium ${pct === 100 ? 'text-green-600' : 'text-gray-400'}`}>
                          {pct === 100 ? '✓ Completada' : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-green-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {total_ === 0 && (
                    <p className="text-xs text-gray-400 mt-2">Lista vacía — tocá para agregar productos</p>
                  )}
                </button>

                {/* Actions footer */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(viaje.id) }}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      deleteConfirm === viaje.id
                        ? 'text-white bg-red-500'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={12} />
                    {deleteConfirm === viaje.id ? 'Confirmar' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setOpenTripId(viaje.id)}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Abrir lista
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New trip modal */}
      <Modal isOpen={showNewTrip} onClose={() => setShowNewTrip(false)} title="Nueva compra">
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={newForm.descripcion}
              onChange={(e) => setNewForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Ej: Super semana, Almacén extra..."
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newForm.fecha}
              onChange={(e) => setNewForm((p) => ({ ...p, fecha: e.target.value }))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowNewTrip(false)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
            >
              Crear y abrir lista
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
