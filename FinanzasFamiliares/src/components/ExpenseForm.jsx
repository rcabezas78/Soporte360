import { useState, useEffect, useRef } from 'react'
import { Paperclip, X, FileText, ImageIcon, AlertTriangle } from 'lucide-react'
import { CATEGORIES } from '../utils/categories'
import { todayISO } from '../utils/formatters'

const EMPTY = { descripcion: '', monto: '', categoria: 'compras', fecha: todayISO(), notas: '', comprobante: null }
const MAX_SIZE_MB = 2

export default function ExpenseForm({ expense, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState('')
  const [loadingFile, setLoadingFile] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (expense) {
      setForm({ ...expense, monto: String(expense.monto) })
    } else {
      setForm({ ...EMPTY, fecha: todayISO() })
    }
    setErrors({})
    setFileError('')
  }, [expense])

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setFileError('Solo se admiten imágenes (JPG, PNG, WEBP) o PDF')
      e.target.value = ''
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`El archivo supera el límite de ${MAX_SIZE_MB} MB`)
      e.target.value = ''
      return
    }

    setLoadingFile(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        comprobante: {
          name: file.name,
          type: file.type,
          size: file.size,
          data: ev.target.result,
        },
      }))
      setLoadingFile(false)
    }
    reader.readAsDataURL(file)
  }

  const removeComprobante = () => {
    setForm((prev) => ({ ...prev, comprobante: null }))
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const errs = {}
    if (!form.descripcion.trim()) errs.descripcion = 'Requerido'
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0)
      errs.monto = 'Ingresá un monto válido'
    if (!form.fecha) errs.fecha = 'Requerido'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onSave({ ...form, monto: parseFloat(form.monto) })
  }

  const selectedCat = CATEGORIES.find((c) => c.id === form.categoria) ?? CATEGORIES[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Descripción */}
      <Field label="Descripción" error={errors.descripcion} required>
        <input
          type="text"
          value={form.descripcion}
          onChange={set('descripcion')}
          placeholder="Ej: Cuota club julio"
          autoFocus
          className={inputCls(errors.descripcion)}
        />
      </Field>

      {/* Monto */}
      <Field label="Monto ($)" error={errors.monto} required>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.monto}
            onChange={set('monto')}
            placeholder="0.00"
            className={`${inputCls(errors.monto)} pl-7`}
          />
        </div>
      </Field>

      {/* Categoría */}
      <Field label="Categoría">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, categoria: cat.id }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                form.categoria === cat.id
                  ? `${cat.bg} ${cat.text} ${cat.border} ring-2 ring-offset-1 ring-${cat.color}-400`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Fecha */}
      <Field label="Fecha" error={errors.fecha} required>
        <input
          type="date"
          value={form.fecha}
          onChange={set('fecha')}
          className={inputCls(errors.fecha)}
        />
      </Field>

      {/* Comprobante */}
      <Field label="Comprobante de pago (opcional)">
        {form.comprobante ? (
          <ComprobantePreview comprobante={form.comprobante} onRemove={removeComprobante} />
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            fileError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}>
            <div className="flex items-center gap-2 text-gray-400">
              {loadingFile ? (
                <span className="text-xs">Cargando...</span>
              ) : (
                <>
                  <Paperclip size={16} />
                  <span className="text-sm font-medium text-gray-600">Adjuntar comprobante</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP o PDF · máx. {MAX_SIZE_MB} MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
        {fileError && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle size={12} /> {fileError}
          </p>
        )}
      </Field>

      {/* Notas */}
      <Field label="Notas (opcional)">
        <textarea
          value={form.notas}
          onChange={set('notas')}
          placeholder="Información adicional..."
          rows={2}
          className={`${inputCls()} resize-none`}
        />
      </Field>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingFile}
          className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors bg-gradient-to-r ${selectedCat.card} hover:opacity-90 shadow-sm disabled:opacity-50`}
        >
          {expense ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </form>
  )
}

function ComprobantePreview({ comprobante, onRemove }) {
  const isImage = comprobante.type.startsWith('image/')
  const sizeKB = Math.round(comprobante.size / 1024)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      {isImage ? (
        <div className="relative">
          <img
            src={comprobante.data}
            alt="Comprobante"
            className="w-full max-h-40 object-contain bg-white"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <FileText size={20} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{comprobante.name}</p>
            <p className="text-xs text-gray-400">PDF · {sizeKB} KB</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-1.5 min-w-0">
          {isImage ? <ImageIcon size={13} className="text-gray-400 shrink-0" /> : <FileText size={13} className="text-gray-400 shrink-0" />}
          <span className="text-xs text-gray-500 truncate">{comprobante.name}</span>
          <span className="text-xs text-gray-400 shrink-0">· {sizeKB} KB</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          title="Quitar comprobante"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function Field({ label, children, error, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition ${
    error
      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
      : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'
  }`
}
