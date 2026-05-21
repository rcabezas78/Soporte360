import { useState, useCallback } from 'react'
import { ArrowLeft, Plus, Trash2, ShoppingCart, PackageCheck } from 'lucide-react'
import Modal from '../Modal'
import ItemPicker from './ItemPicker'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function TripDetail({ viaje, catalogo, calcTotales, onBack, onUpdateItem, onRemoveItem, onToggleItem, onAddItems }) {
  const [showPicker, setShowPicker] = useState(false)

  const { total, totalCarrito } = calcTotales(viaje)
  const checkedCount = viaje.items.filter((i) => i.checked).length
  const totalCount = viaje.items.length

  const unchecked = viaje.items.filter((i) => !i.checked)
  const checked = viaje.items.filter((i) => i.checked)

  const handlePickerAdd = useCallback(
    ({ fromCatalogo, manual }) => {
      const items = [
        ...fromCatalogo.map((p) => ({
          id: crypto.randomUUID(),
          catalogoId: p.id,
          nombre: p.nombre,
          precioRef: p.precioRef,
          cantidad: 1,
          precioUnitario: p.precioRef ?? null,
          checked: false,
        })),
        ...manual.map((nombre) => ({
          id: crypto.randomUUID(),
          catalogoId: null,
          nombre,
          precioRef: null,
          cantidad: 1,
          precioUnitario: null,
          checked: false,
        })),
      ]
      onAddItems(viaje.id, items)
      setShowPicker(false)
    },
    [viaje.id, onAddItems]
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">{viaje.descripcion}</h2>
          <p className="text-xs text-gray-400">{formatDate(viaje.fecha)}</p>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard
          label="Presupuesto"
          value={formatCurrency(total)}
          color="indigo"
          icon={<ShoppingCart size={14} />}
        />
        <StatCard
          label="En carrito"
          value={formatCurrency(totalCarrito)}
          color="green"
          icon={<PackageCheck size={14} />}
        />
        <StatCard
          label="Progreso"
          value={`${checkedCount}/${totalCount}`}
          color="orange"
          sub={totalCount > 0 ? `${Math.round((checkedCount / totalCount) * 100)}%` : '—'}
        />
      </div>

      {/* Items */}
      {totalCount === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🛒</p>
          <p className="text-sm font-medium">Lista vacía</p>
          <button
            onClick={() => setShowPicker(true)}
            className="mt-3 text-sm text-green-600 hover:underline font-medium"
          >
            Agregar productos
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Por comprar */}
          {unchecked.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Por comprar ({unchecked.length})
              </p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {unchecked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => onToggleItem(viaje.id, item.id)}
                    onUpdate={(data) => onUpdateItem(viaje.id, item.id, data)}
                    onRemove={() => onRemoveItem(viaje.id, item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* En carrito */}
          {checked.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 px-1">
                En el carrito ({checked.length})
              </p>
              <div className="bg-green-50/50 rounded-xl border border-green-100 shadow-sm divide-y divide-green-50/80">
                {checked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    checked
                    onToggle={() => onToggleItem(viaje.id, item.id)}
                    onUpdate={(data) => onUpdateItem(viaje.id, item.id, data)}
                    onRemove={() => onRemoveItem(viaje.id, item.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sticky total */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">En carrito</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalCarrito)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total estimado</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Item Picker Modal */}
      <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Agregar productos">
        <ItemPicker
          catalogo={catalogo}
          itemsEnViaje={viaje.items}
          onAdd={handlePickerAdd}
          onClose={() => setShowPicker(false)}
        />
      </Modal>
    </div>
  )
}

function ItemRow({ item, checked, onToggle, onUpdate, onRemove }) {
  const [editingCantidad, setEditingCantidad] = useState(false)
  const [editingPrecio, setEditingPrecio] = useState(false)
  const [tempCant, setTempCant] = useState('')
  const [tempPrecio, setTempPrecio] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const subtotal =
    (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)

  const startEdit = (field) => {
    if (field === 'cantidad') {
      setTempCant(String(item.cantidad ?? 1))
      setEditingCantidad(true)
    } else {
      setTempPrecio(item.precioUnitario ? String(item.precioUnitario) : '')
      setEditingPrecio(true)
    }
  }

  const commitCant = () => {
    const v = parseFloat(tempCant)
    if (!isNaN(v) && v > 0) onUpdate({ cantidad: v })
    setEditingCantidad(false)
  }

  const commitPrecio = () => {
    const v = parseFloat(tempPrecio)
    if (!isNaN(v) && v >= 0) onUpdate({ precioUnitario: v })
    setEditingPrecio(false)
  }

  const handleDelete = () => {
    if (confirmDelete) {
      onRemove()
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 2500)
    }
  }

  return (
    <div className={`px-3 py-2.5 transition-colors ${checked ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            checked
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {checked && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-900 ${checked ? 'line-through text-gray-400' : ''}`}>
            {item.nombre}
          </p>

          {/* Qty × Price row */}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {/* Cantidad */}
            {editingCantidad ? (
              <input
                type="number"
                value={tempCant}
                onChange={(e) => setTempCant(e.target.value)}
                onBlur={commitCant}
                onKeyDown={(e) => e.key === 'Enter' && commitCant()}
                autoFocus
                min="0.1"
                step="0.5"
                className="w-16 px-1.5 py-0.5 text-xs border border-green-400 rounded focus:outline-none focus:ring-1 focus:ring-green-300 text-center"
              />
            ) : (
              <button
                onClick={() => startEdit('cantidad')}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded font-medium text-gray-700 transition-colors min-w-[2rem] text-center"
              >
                {item.cantidad ?? 1}
              </button>
            )}

            <span className="text-xs text-gray-400">×</span>

            {/* Precio */}
            {editingPrecio ? (
              <input
                type="number"
                value={tempPrecio}
                onChange={(e) => setTempPrecio(e.target.value)}
                onBlur={commitPrecio}
                onKeyDown={(e) => e.key === 'Enter' && commitPrecio()}
                autoFocus
                min="0"
                step="1"
                placeholder="Precio"
                className="w-24 px-1.5 py-0.5 text-xs border border-green-400 rounded focus:outline-none focus:ring-1 focus:ring-green-300 text-center"
              />
            ) : (
              <button
                onClick={() => startEdit('precio')}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                  item.precioUnitario
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-dashed border-orange-300'
                }`}
              >
                {item.precioUnitario
                  ? `$${Number(item.precioUnitario).toLocaleString('es-AR')}`
                  : 'Precio?'}
              </button>
            )}

            {subtotal > 0 && (
              <>
                <span className="text-xs text-gray-400">=</span>
                <span className="text-xs font-semibold text-gray-800">
                  {formatCurrency(subtotal)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
            confirmDelete
              ? 'bg-red-500 text-white'
              : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
          }`}
          title={confirmDelete ? 'Confirmar' : 'Quitar'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon, sub }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1 mb-1 opacity-70">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-sm font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}
