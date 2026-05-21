import { useLocalStorage } from './useLocalStorage'
import { todayISO } from '../utils/formatters'

const SEED_DATA = [
  { id: '1', descripcion: 'ABL - Primer cuota', categoria: 'impuestos', monto: 8500, fecha: '2026-05-05', notas: '' },
  { id: '2', descripcion: 'Cuota mensual Club', categoria: 'club', monto: 12000, fecha: '2026-05-10', notas: 'Incluye actividades deportivas' },
  { id: '3', descripcion: 'Cuota escolar', categoria: 'escuela', monto: 25000, fecha: '2026-05-01', notas: '' },
  { id: '4', descripcion: 'Supermercado semanal', categoria: 'compras', monto: 18000, fecha: '2026-05-15', notas: '' },
  { id: '5', descripcion: 'Luz - EDESUR', categoria: 'servicios', monto: 9500, fecha: '2026-05-12', notas: '' },
]

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorage('ff_expenses', SEED_DATA)

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: crypto.randomUUID(),
      fecha: expense.fecha || todayISO(),
    }
    setExpenses((prev) => [newExpense, ...prev])
    return newExpense
  }

  const updateExpense = (id, data) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    )
  }

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const getByCategory = (categoryId) =>
    expenses.filter((e) => e.categoria === categoryId)

  const totalByCategory = (categoryId) =>
    getByCategory(categoryId).reduce((sum, e) => sum + Number(e.monto), 0)

  const totalGeneral = expenses.reduce((sum, e) => sum + Number(e.monto), 0)

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getByCategory,
    totalByCategory,
    totalGeneral,
  }
}
