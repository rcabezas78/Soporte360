import { getCategoryById } from '../utils/categories'

export default function CategoryBadge({ categoryId, size = 'sm' }) {
  const cat = getCategoryById(categoryId)
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${padding} ${cat.bg} ${cat.text}`}>
      <span>{cat.icon}</span>
      {cat.label}
    </span>
  )
}
