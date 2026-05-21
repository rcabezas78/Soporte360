import { X, Download, FileText } from 'lucide-react'
import { useEffect } from 'react'

export default function ComprobanteViewer({ comprobante, descripcion, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isImage = comprobante.type.startsWith('image/')

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = comprobante.data
    a.download = comprobante.name
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{descripcion}</p>
            <p className="text-xs text-gray-400 truncate">{comprobante.name} · {Math.round(comprobante.size / 1024)} KB</p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Download size={13} />
              Descargar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
          {isImage ? (
            <img
              src={comprobante.data}
              alt="Comprobante de pago"
              className="max-w-full max-h-full object-contain rounded-lg shadow"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <iframe
                src={comprobante.data}
                title="Comprobante PDF"
                className="w-full rounded-lg shadow"
                style={{ height: '60vh', minWidth: 'min(600px, 80vw)' }}
              />
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Download size={15} />
                Descargar PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
