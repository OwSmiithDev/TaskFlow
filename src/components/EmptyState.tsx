import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFilters } from '../context/FilterContext'

interface Props {
  filtered?: boolean
}

export function EmptyState({ filtered }: Props) {
  const { setIsCreating } = useApp()
  const { setSearch, setFilterStatus, setFilterResponsavel } = useFilters()

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterResponsavel('')
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Illustration */}
      <div className="w-24 h-24 mb-6 relative">
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="12" y="16" width="72" height="64" rx="8" className="fill-gray-100 dark:fill-gray-800" />
          <rect x="22" y="30" width="40" height="5" rx="2.5" className="fill-gray-300 dark:fill-gray-600" />
          <rect x="22" y="43" width="52" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="22" y="56" width="32" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
          <circle cx="70" cy="68" r="16" className="fill-indigo-100 dark:fill-indigo-900/40" />
          <path d="M70 62v12M64 68h12" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {filtered ? (
        <>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Nenhuma tarefa encontrada
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-5">
            Tente ajustar os filtros ou a busca para encontrar o que procura.
          </p>
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Limpar filtros
          </button>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Nenhuma tarefa ainda
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-5">
            Crie sua primeira tarefa para começar a organizar seu trabalho.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white
                       px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Criar primeira tarefa
          </button>
        </>
      )}
    </div>
  )
}
