import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useModalBehavior } from '../hooks/useModalBehavior'

interface Props {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: Props) {
  const panelRef = useModalBehavior<HTMLDivElement>(onCancel)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus the non-destructive action, so Enter can't delete by accident.
  useEffect(() => { cancelRef.current?.focus() }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200
                   dark:border-gray-700 p-6 w-full max-w-sm"
      >
        <div className="flex gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
            className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0"
          >
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
          </motion.div>
          <div>
            <h2
              id="confirm-title"
              className="font-semibold text-gray-900 dark:text-white text-base mb-1"
            >
              {title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
                       transition-colors"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700
                       active:bg-red-800 rounded-lg transition-colors"
          >
            Excluir
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
