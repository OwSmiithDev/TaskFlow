import { motion } from 'framer-motion'
import { LayoutGrid, List, Moon, Plus, Search, Settings, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useFilters } from '../context/FilterContext'

function TaskFlowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.65" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.65" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.35" />
    </svg>
  )
}

const iconBtnClass =
  'p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0'

export function Header() {
  const { view, setView, theme, toggleTheme, setIsCreating, setIsSettingsOpen } = useApp()
  const { search, setSearch } = useFilters()

  const viewTabs = [
    { id: 'list' as const, label: 'Lista', icon: <List size={15} /> },
    { id: 'kanban' as const, label: 'Kanban', icon: <LayoutGrid size={15} /> },
  ]

  const viewToggle = (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5 shrink-0">
      {viewTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          aria-label={`Visualização ${tab.label}`}
          aria-pressed={view === tab.id}
          className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm rounded-md font-medium transition-colors
            ${view === tab.id
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          {view === tab.id && (
            <motion.div
              layoutId="view-tab-pill"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>
  )

  const searchInput = (cls: string) => (
    <div className={`relative ${cls}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="search"
        placeholder="Buscar tarefas..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent
                   rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
                   dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
      />
    </div>
  )

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4">

        {/* ── Main row ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 shrink-0"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm"
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <TaskFlowIcon size={16} />
            </motion.div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight hidden sm:block">
              Task<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
            </span>
          </motion.div>

          {/* Search — visible only on sm+ in the main row */}
          {searchInput('hidden sm:block flex-1 max-w-sm')}

          {/* Actions — always visible, pushed right */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            {viewToggle}

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={toggleTheme}
              aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
              className={iconBtnClass}
            >
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Configurações"
              className={iconBtnClass}
            >
              <Settings size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                         text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova tarefa</span>
            </motion.button>
          </div>
        </div>

        {/* ── Mobile search row (below main row) ────────────────────── */}
        <div className="sm:hidden pb-2.5">
          {searchInput('w-full')}
        </div>

      </div>
    </header>
  )
}
