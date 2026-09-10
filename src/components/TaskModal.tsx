import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useModalBehavior } from '../hooks/useModalBehavior'
import type { Priority, Task } from '../types'
import { PRIORITY_CONFIG, TAG_COLORS } from '../types'

function makeEmpty(firstColId: string): Omit<Task, 'id' | 'criado_em'> {
  return {
    titulo: '',
    descricao: '',
    status: firstColId,
    prioridade: 'media',
    responsavel: '',
    prazo: '',
    etiquetas: [],
  }
}

const formVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' as const },
  },
}

export function TaskModal() {
  const { editingTask, setEditingTask, setIsCreating, addTask, updateTask, showToast, columns, tags } =
    useApp()

  const isEditing = !!editingTask
  const [form, setForm] = useState<Omit<Task, 'id' | 'criado_em'>>(
    editingTask ? { ...editingTask } : makeEmpty(columns[0]?.id ?? 'todo'),
  )
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const titleRef = useRef<HTMLInputElement>(null)

  const panelRef = useModalBehavior<HTMLDivElement>(() => handleClose())

  useEffect(() => { titleRef.current?.focus() }, [])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function toggleTag(name: string) {
    set(
      'etiquetas',
      form.etiquetas.includes(name)
        ? form.etiquetas.filter(t => t !== name)
        : [...form.etiquetas, name],
    )
  }

  function addCustomTag(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!form.etiquetas.includes(tag)) set('etiquetas', [...form.etiquetas, tag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    set('etiquetas', form.etiquetas.filter(t => t !== tag))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.titulo.trim()) errs.titulo = 'O título é obrigatório'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (isEditing && editingTask) {
      updateTask(editingTask.id, form)
      showToast('Tarefa atualizada!')
    } else {
      addTask(form)
    }
    handleClose()
  }

  function handleClose() {
    setEditingTask(null)
    setIsCreating(false)
  }

  const inputClass =
    'w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ' +
    'rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
    'text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all'
  const labelClass =
    'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide'

  const allTagNames = [
    ...new Set([...tags.map(t => t.name), ...form.etiquetas]),
  ]

  function getChipClass(name: string) {
    const t = tags.find(t => t.name === name)
    return t
      ? TAG_COLORS[t.color].chipClass
      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  }

  const filteredSuggestions = tagInput.trim()
    ? allTagNames.filter(n => n.includes(tagInput.toLowerCase()) && !form.etiquetas.includes(n))
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200
                   dark:border-gray-700 w-full max-w-lg max-h-[90dvh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={handleClose}
            aria-label="Fechar"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Título */}
          <motion.div variants={fieldVariants}>
            <label htmlFor="titulo" className={labelClass}>
              Título <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="titulo"
              type="text"
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              placeholder="Descreva a tarefa brevemente"
              className={`${inputClass} ${errors.titulo ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              maxLength={120}
            />
            <AnimatePresence>
              {errors.titulo && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-red-500 mt-1"
                >
                  {errors.titulo}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Descrição */}
          <motion.div variants={fieldVariants}>
            <label htmlFor="descricao" className={labelClass}>Descrição</label>
            <textarea
              id="descricao"
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Detalhes adicionais sobre a tarefa..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </motion.div>

          {/* Status + Prioridade */}
          <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className={labelClass}>Status</label>
              <select
                id="status"
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputClass}
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.rotulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prioridade" className={labelClass}>
                Prioridade <span className="text-red-500">*</span>
              </label>
              <select
                id="prioridade"
                value={form.prioridade}
                onChange={e => set('prioridade', e.target.value as Priority)}
                className={inputClass}
              >
                {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string }][]).map(
                  ([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ),
                )}
              </select>
            </div>
          </motion.div>

          {/* Responsável + Prazo */}
          <motion.div variants={fieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="responsavel" className={labelClass}>Responsável</label>
              <input
                id="responsavel"
                type="text"
                value={form.responsavel}
                onChange={e => set('responsavel', e.target.value)}
                placeholder="Nome do responsável"
                className={inputClass}
                maxLength={60}
              />
            </div>
            <div>
              <label htmlFor="prazo" className={labelClass}>Prazo</label>
              <input
                id="prazo"
                type="date"
                value={form.prazo}
                onChange={e => set('prazo', e.target.value)}
                className={inputClass}
              />
            </div>
          </motion.div>

          {/* Etiquetas */}
          <motion.div variants={fieldVariants}>
            <label className={labelClass}>Etiquetas</label>

            {/* Tag chips from store */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map(tag => {
                  const selected = form.etiquetas.includes(tag.name)
                  return (
                    <motion.button
                      key={tag.id}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => toggleTag(tag.name)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
                                  border transition-all
                                  ${selected
                                    ? `${TAG_COLORS[tag.color].chipClass} border-current`
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-current'
                                  }`}
                    >
                      <AnimatePresence>
                        {selected && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check size={10} strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {tag.name}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Custom tag input */}
            <div className="relative">
              <input
                id="etiquetas"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addCustomTag}
                placeholder="Ou digite para criar uma etiqueta personalizada…"
                className={inputClass}
                maxLength={30}
              />
              <AnimatePresence>
                {filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
                  >
                    {filteredSuggestions.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => { toggleTag(name); setTagInput('') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${getChipClass(name)}`}>
                          {name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected custom tags not in store */}
            {form.etiquetas.filter(e => !tags.some(t => t.name === e)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.etiquetas
                  .filter(e => !tags.some(t => t.name === e))
                  .map(tag => (
                    <motion.span
                      key={tag}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30
                                 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remover etiqueta ${tag}`}
                      >
                        <X size={11} />
                      </button>
                    </motion.span>
                  ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">
              Clique nas etiquetas disponíveis ou pressione Enter para criar uma nova
            </p>
          </motion.div>
        </motion.form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                       active:bg-indigo-800 rounded-lg transition-colors shadow-sm"
          >
            {isEditing ? 'Salvar alterações' : 'Criar tarefa'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
