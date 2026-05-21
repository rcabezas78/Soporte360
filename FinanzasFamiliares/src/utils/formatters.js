export const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export const formatMonth = (dateStr) => {
  if (!dateStr) return ''
  const [y, m] = dateStr.split('-')
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  return `${months[parseInt(m, 10) - 1]} ${y}`
}

export const todayISO = () => new Date().toISOString().split('T')[0]

export const monthKey = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.substring(0, 7)
}
