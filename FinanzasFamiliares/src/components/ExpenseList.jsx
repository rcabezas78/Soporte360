import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Pencil, Trash2, ChevronDown, Paperclip } from 'lucide-react'
import { CATEGORIES } from '../utils/categories'
import { formatCurrency, formatDate, monthKey } from '../utils/formatters'
import CategoryBadge from './CategoryBadge'
import ComprobanteViewer from './ComprobanteViewer'

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [sortBy, setSortBy] = useState('fecha_desc')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewingComprobante, setViewingComprobante] = useState(null)

  const months = useMemo(() => {
    const keys = [...new Set(expenses.map((e) => monthKey(e.fecha)))].sort((a, b) => b.localeCompare(a))
    return keys
  }, [expenses])

  const filtered = useMemo(() => {
    let result = expenses.filter((e) => {
      const matchSearch =
        !search || e.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        (e.notas && e.notas.toLowerCase().includes(search.toLowerCase()))
      const matchCat = filterCat === 'all' || e.categoria === filterCat
      const matchMonth = filterMonth === 'all' || monthKey(e.fecha) === filterMonth
      return matchSearch && matchCat && matchMonth
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'fecha_desc') return b.fecha.localeCompare(a.fecha)
      if (sortBy === 'fecha_asc') return a.fecha.localeCompare(b.fecha)
      if (sortBy === 'monto_desc') return Number(b.monto) - Number(a.monto)
      if (sortBy === 'monto_asc') return Number(a.monto) - Number(b.monto)
      return 0
    })
    return result
  }, [expenses, search, filterCat, filterMonth, sortBy])

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.monto), 0)

  const handleDelete = (id) => {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar gastos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          <SelectFilter
            value={filterCat}
            onChange={setFilterCat}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` })),
            ]}
          />
          <SelectFilter
            value={filterMonth}
            onChange={setFilterMonth}
            options={[
              { value: 'all', label: 'Todos los meses' },
              ...months.map((m) => ({ value: m, label: formatMonthLabel(m) })),
            ]}
          />
          <SelectFilter
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'fecha_desc', label: 'Más recientes' },
              { value: 'fecha_asc', label: 'Más antiguos' },
              { value: 'monto_desc', label: 'Mayor monto' },
              { value: 'monto_asc', label: 'Menor monto' },
            ]}
            icon={<SlidersHorizontal size={14} />}
          />
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          {filtered.length} {filtered.length === 1 ? 'gasto' : 'gastos'}
        </p>
        <p className="text-sm font-semibold text-gray-800">{formatCurrency(totalFiltered)}</p>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm font-medium">No se encontraron gastos</p>
          <p className="text-xs mt-1">Probá cambiando los filtros</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {filtered.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onEdit={() => onEdit(expense)}
              onDelete={() => handleDelete(expense.id)}
              onViewComprobante={() => setViewingComprobante(expense)}
              confirmingDelete={deleteConfirm === expense.id}
            />
          ))}
        </div>
      )}

      {viewingComprobante?.comprobante && (
        <ComprobanteViewer
          comprobante={viewingComprobante.comprobante}
          descripcion={viewingComprobante.descripcion}
          onClose={() => setViewingComprobante(null)}
        />
      )}
    </div>
  )
}

function ExpenseRow({ expense, onEdit, onDelete, onViewComprobante, confirmingDelete }) {
  const hasComprobante = !!expense.comprobante
  const isImage = hasComprobante && expense.comprobante.type.startsWith('image/')

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors group">
      {/* Thumbnail preview for image receipts */}
      {hasComprobante && isImage && (
        <button
          onClick={onViewComprobante}
          className="hidden sm:block shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-300 transition-colors"
          title="Ver comprobante"
        >
          <img
            src={expense.comprobante.data}
            alt="Comprobante"
            className="w-full h-full object-cover"
          />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 truncate">{expense.descripcion}</p>
          <CategoryBadge categoryId={expense.categoria} />
          {hasComprobante && (
            <button
              onClick={onViewComprobante}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
              title="Ver comprobante"
            >
              <Paperclip size={10} />
              {isImage ? 'Imagen' : 'PDF'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400">{formatDate(expense.fecha)}</p>
          {expense.notas && (
            <p className="text-xs text-gray-400 truncate max-w-[200px]">· {expense.notas}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
          {formatCurrency(Number(expense.monto))}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className={`p-1.5 rounded-lg transition-colors ${
              confirmingDelete
                ? 'text-white bg-red-500 hover:bg-red-600'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
            title={confirmingDelete ? 'Confirmar eliminación' : 'Eliminar'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SelectFilter({ value, onChange, options, icon }) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-gray-50 border border-gray-200 text-sm rounded-lg py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer text-gray-700 ${icon ? 'pl-7' : 'pl-3'}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${months[parseInt(m, 10) - 1]} ${y}`
}
