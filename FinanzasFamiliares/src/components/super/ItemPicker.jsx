import { useState, useMemo } from 'react'
import { Search, X, Plus, Check } from 'lucide-react'

export default function ItemPicker({ catalogo, itemsEnViaje, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [nuevoNombre, setNuevoNombre] = useState('')

  const yaEnViaje = useMemo(
    () => new Set(itemsEnViaje.map((i) => i.catalogoId).filter(Boolean)),
    [itemsEnViaje]
  )

  const filtrado = useMemo(() => {
    const q = search.toLowerCase().trim()
    return catalogo
      .filter((p) => !yaEnViaje.has(p.id))
      .filter((p) => !q || p.nombre.toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [catalogo, search, yaEnViaje])

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleAdd = () => {
    const prods = catalogo.filter((p) => selected.has(p.id))
    onAdd({ fromCatalogo: prods, manual: [] })
  }

  const handleAddManual = () => {
    const nombre = nuevoNombre.trim()
    if (!nombre) return
    onAdd({ fromCatalogo: [], manual: [nombre] })
    setNuevoNombre('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddManual()
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: '70vh' }}>
      {/* Search */}
      <div className="relative shrink-0">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en el catálogo..."
          autoFocus
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
        />
      </div>

      {/* Add custom item */}
      <div className="flex gap-2 mt-3 shrink-0">
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Agregar producto que no está en la lista..."
          className="flex-1 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition placeholder:text-gray-400"
        />
        <button
          onClick={handleAddManual}
          disabled={!nuevoNombre.trim()}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          title="Agregar"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Catalog list */}
      <div className="flex-1 overflow-y-auto mt-3 border border-gray-100 rounded-xl divide-y divide-gray-50">
        {filtrado.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {search ? `Sin resultados para "${search}"` : 'Todos los productos ya están en la lista'}
          </div>
        ) : (
          filtrado.map((prod) => {
            const isSelected = selected.has(prod.id)
            return (
              <button
                key={prod.id}
                onClick={() => toggle(prod.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="flex-1 text-sm text-gray-800">{prod.nombre}</span>
                {prod.precioRef && (
                  <span className="text-xs text-gray-400 shrink-0">
                    ref. ${prod.precioRef.toLocaleString('es-AR')}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 mt-4 shrink-0 pt-3 border-t border-gray-100">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleAdd}
          disabled={selected.size === 0}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-lg transition-colors"
        >
          Agregar {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </div>
  )
}
