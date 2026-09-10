import { CalendarClock } from 'lucide-react'
import { isOverdue } from '../utils/dates'

interface Props {
  prazo: string
  size?: 'sm' | 'md'
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function DueDateLabel({ prazo, size = 'md' }: Props) {
  if (!prazo) return null
  const overdue = isOverdue(prazo)
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span
      className={`flex items-center gap-1 ${textSize} font-medium ${
        overdue
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-500 dark:text-gray-400'
      }`}
      aria-label={overdue ? `Vencido: ${prazo}` : `Prazo: ${prazo}`}
    >
      <CalendarClock size={size === 'sm' ? 11 : 13} />
      {formatDate(prazo)}
    </span>
  )
}
