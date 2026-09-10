import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, lazy } from 'react'
import { useApp } from './context/AppContext'
import { AppProvider } from './context/AppProvider'
import { FilterProvider } from './context/FilterProvider'
import { Header } from './components/Header'
import { ListView } from './components/ListView'
import { KanbanView } from './components/KanbanView'
import { TaskModal } from './components/TaskModal'
import { TaskViewModal } from './components/TaskViewModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ToastContainer } from './components/Toast'

// Settings is the largest component in the app and most sessions never open
// it, so it is fetched on demand rather than in the initial bundle.
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })),
)

function AppContent() {
  const {
    view,
    isSettingsOpen,
    viewingTask,
    editingTask,
    isCreating,
    deletingTaskId,
    tasks,
    deleteTask,
    setDeletingTaskId,
  } = useApp()

  const deletingTask = deletingTaskId ? tasks.find(t => t.id === deletingTaskId) : null

  return (
    <div className="min-h-dvh bg-white/70 dark:bg-gray-950/80 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header />

      {/*
        List view gets max-width + padding.
        Kanban view gets NO width constraint so overflow-x-auto
        can scroll across the full viewport at any zoom level.
      */}
      <main className="py-6">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              className="max-w-screen-xl mx-auto px-3 sm:px-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ListView />
            </motion.div>
          ) : (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <KanbanView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <Suspense key="settings" fallback={null}>
            <SettingsModal />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingTask && <TaskViewModal key="view" />}
      </AnimatePresence>

      <AnimatePresence>
        {(isCreating || editingTask) && <TaskModal key="modal" />}
      </AnimatePresence>

      <AnimatePresence>
        {deletingTaskId && deletingTask && (
          <ConfirmDialog
            key="confirm"
            title="Excluir tarefa"
            message={`Deseja excluir "${deletingTask.titulo}"? Esta ação não pode ser desfeita.`}
            onConfirm={() => {
              deleteTask(deletingTaskId)
              setDeletingTaskId(null)
            }}
            onCancel={() => setDeletingTaskId(null)}
          />
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <FilterProvider>
        <AppContent />
      </FilterProvider>
    </AppProvider>
  )
}
