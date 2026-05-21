import { TrendingUp, ArrowUpRight } from 'lucide-react'
import { CATEGORIES } from '../utils/categories'
import { formatCurrency, monthKey, formatMonth } from '../utils/formatters'

export default function Dashboard({ expenses, totalGeneral, totalByCategory, setView, onAdd }) {
  const currentMonth = monthKey(new Date().toISOString().split('T')[0])
  const expensesThisMonth = expenses.filter((e) => monthKey(e.fecha) === currentMonth)
  const totalThisMonth = expensesThisMonth.reduce((s, e) => s + Number(e.monto), 0)

  const lastMonthKey = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return monthKey(d.toISOString().split('T')[0])
  })()
  const totalLastMonth = expenses
    .filter((e) => monthKey(e.fecha) === lastMonthKey)
    .reduce((s, e) => s + Number(e.monto), 0)

  const diff = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0
  const recentExpenses = [...expenses].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title={`Total ${formatMonth(currentMonth + '-01')}`}
          value={formatCurrency(totalThisMonth)}
          sub={
            totalLastMonth > 0
              ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs mes anterior`
              : 'Sin datos mes anterior'
          }
          positive={diff < 0}
          icon={<TrendingUp size={20} />}
          accent="indigo"
        />
        <SummaryCard
          title="Total acumulado"
          value={formatCurrency(totalGeneral)}
          sub={`${expenses.length} gastos registrados`}
          icon="📊"
          accent="violet"
        />
        <SummaryCard
          title="Categorías activas"
          value={CATEGORIES.filter((c) => totalByCategory(c.id) > 0).length}
          sub="de 7 categorías"
          icon="🗂️"
          accent="sky"
        />
      </div>

      {/* Category breakdown */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Por categoría — todo el período
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const total = totalByCategory(cat.id)
            const pct = totalGeneral > 0 ? (total / totalGeneral) * 100 : 0
            return (
              <button
                key={cat.id}
                onClick={() => setView('gastos')}
                className={`text-left p-4 rounded-xl border ${cat.border} ${cat.bg} hover:shadow-md transition-all group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <ArrowUpRight
                    size={14}
                    className={`${cat.text} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
                <p className={`text-xs font-medium ${cat.text} mb-0.5`}>{cat.label}</p>
                <p className="text-base font-bold text-gray-900 leading-tight">
                  {formatCurrency(total)}
                </p>
                <div className="mt-2 h-1 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.dot} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}%</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Recent expenses */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Últimos gastos
          </h3>
          <button
            onClick={() => setView('gastos')}
            className="text-xs text-indigo-600 font-medium hover:underline"
          >
            Ver todos →
          </button>
        </div>
        {recentExpenses.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
            {recentExpenses.map((e) => {
              const cat = CATEGORIES.find((c) => c.id === e.categoria) ?? CATEGORIES[CATEGORIES.length - 1]
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.descripcion}</p>
                    <p className="text-xs text-gray-400">{cat.label} · {formatDateShort(e.fecha)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(Number(e.monto))}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({ title, value, sub, icon, accent, positive }) {
  const accents = {
    indigo: 'from-indigo-500 to-indigo-600',
    violet: 'from-violet-500 to-violet-600',
    sky: 'from-sky-500 to-sky-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${accents[accent]} text-white mb-3`}>
        {typeof icon === 'string' ? <span className="text-base leading-none">{icon}</span> : icon}
      </div>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${positive === true ? 'text-green-600' : positive === false ? 'text-red-500' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-2">📭</p>
      <p className="text-sm font-medium">No hay gastos registrados</p>
      <button onClick={onAdd} className="mt-3 text-sm text-indigo-600 hover:underline font-medium">
        Agregar el primero
      </button>
    </div>
  )
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
