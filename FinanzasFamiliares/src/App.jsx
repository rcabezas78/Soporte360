import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import ExpenseList from './components/ExpenseList'
import ExpenseForm from './components/ExpenseForm'
import Modal from './components/Modal'
import SuperPage from './components/super/SuperPage'
import { useExpenses } from './hooks/useExpenses'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  const { expenses, addExpense, updateExpense, deleteExpense, totalByCategory, totalGeneral } =
    useExpenses()

  const openAdd = () => {
    setEditingExpense(null)
    setModalOpen(true)
  }

  const openEdit = (expense) => {
    setEditingExpense(expense)
    setModalOpen(true)
  }

  const handleSave = (data) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data)
    } else {
      addExpense(data)
    }
    setModalOpen(false)
    setEditingExpense(null)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingExpense(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar view={view} setView={setView} onAdd={openAdd} />

      <main>
        {view === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            totalGeneral={totalGeneral}
            totalByCategory={totalByCategory}
            setView={setView}
            onAdd={openAdd}
          />
        )}
        {view === 'gastos' && (
          <ExpenseList
            expenses={expenses}
            onEdit={openEdit}
            onDelete={deleteExpense}
          />
        )}
        {view === 'super' && <SuperPage />}
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
      >
        <ExpenseForm
          expense={editingExpense}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  )
}
