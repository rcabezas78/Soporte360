import { LayoutDashboard, List, PlusCircle, ShoppingCart } from 'lucide-react'

export default function Navbar({ view, setView, onAdd }) {
  const isSuper = view === 'super'

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-gray-900 text-lg leading-tight">
              Finanzas<span className="text-indigo-600">Hogar</span>
            </span>
          </div>
          {!isSuper && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">Nuevo gasto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex">
            <TabBtn
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
              active={view === 'dashboard'}
              onClick={() => setView('dashboard')}
              color="indigo"
            />
            <TabBtn
              icon={<List size={16} />}
              label="Gastos"
              active={view === 'gastos'}
              onClick={() => setView('gastos')}
              color="indigo"
            />
            <TabBtn
              icon={<ShoppingCart size={16} />}
              label="Súper"
              active={view === 'super'}
              onClick={() => setView('super')}
              color="green"
            />
          </nav>
        </div>
      </div>
    </>
  )
}

function TabBtn({ icon, label, active, onClick, color }) {
  const activeColors = {
    indigo: 'border-indigo-600 text-indigo-600',
    green: 'border-green-600 text-green-600',
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? activeColors[color]
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
