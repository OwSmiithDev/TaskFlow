import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Database,
  Download,
  GripVertical,
  Layers,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useModalBehavior } from '../hooks/useModalBehavior'
import type { ColumnColorKey, KanbanCol, TagColor } from '../types'
import {
  COLUMN_COLORS,
  DEFAULT_COLUMNS,
  TAG_COLORS,
} from '../types'
import type { Tag as TagType } from '../types'

// ─── Color swatch pickers ───────────────────────────────────────────────────
function ColColorPicker({
  value,
  onChange,
}: {
  value: ColumnColorKey
  onChange: (c: ColumnColorKey) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(COLUMN_COLORS) as [ColumnColorKey, { dot: string; label: string }][]).map(
        ([key, { dot, label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={label}
            className={`w-6 h-6 rounded-full ${dot} flex items-center justify-center transition-transform hover:scale-110
                        ${value === key ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`}
          >
            {value === key && <Check size={12} className="text-white drop-shadow" strokeWidth={3} />}
          </button>
        ),
      )}
    </div>
  )
}

function TagColorPicker({
  value,
  onChange,
}: {
  value: TagColor
  onChange: (c: TagColor) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(TAG_COLORS) as [TagColor, { dot: string; label: string }][]).map(
        ([key, { dot, label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={label}
            className={`w-6 h-6 rounded-full ${dot} flex items-center justify-center transition-transform hover:scale-110
                        ${value === key ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`}
          >
            {value === key && <Check size={12} className="text-white drop-shadow" strokeWidth={3} />}
          </button>
        ),
      )}
    </div>
  )
}

// ─── Pipeline tab ───────────────────────────────────────────────────────────
function PipelineTab() {
  const { columns, tasks, addColumn, updateColumn, deleteColumn, reorderColumns } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ rotulo: string; colorKey: ColumnColorKey }>({
    rotulo: '',
    colorKey: 'gray',
  })
  const [isAdding, setIsAdding] = useState(false)
  const [newForm, setNewForm] = useState<{ rotulo: string; colorKey: ColumnColorKey }>({
    rotulo: '',
    colorKey: 'violet',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const oldIdx = columns.findIndex(c => c.id === active.id)
    const newIdx = columns.findIndex(c => c.id === over.id)
    reorderColumns(arrayMove(columns, oldIdx, newIdx))
  }

  function startEdit(col: KanbanCol) {
    setEditingId(col.id)
    setEditForm({ rotulo: col.rotulo, colorKey: col.colorKey })
  }

  function saveEdit() {
    if (!editingId || !editForm.rotulo.trim()) return
    updateColumn(editingId, { rotulo: editForm.rotulo.trim(), colorKey: editForm.colorKey })
    setEditingId(null)
  }

  function handleAdd() {
    if (!newForm.rotulo.trim()) return
    addColumn({ rotulo: newForm.rotulo.trim(), colorKey: newForm.colorKey })
    setNewForm({ rotulo: '', colorKey: 'violet' })
    setIsAdding(false)
  }

  const isDefault = (id: string) => DEFAULT_COLUMNS.some(c => c.id === id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Organize as etapas do seu fluxo. Arraste para reordenar.
        </p>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400
                     hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} /> Nova coluna
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Nova coluna
          </p>
          <input
            autoFocus
            type="text"
            value={newForm.rotulo}
            onChange={e => setNewForm(f => ({ ...f, rotulo: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false) }}
            placeholder="Nome da coluna"
            maxLength={40}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                       rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
          />
          <ColColorPicker
            value={newForm.colorKey}
            onChange={c => setNewForm(f => ({ ...f, colorKey: c }))}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Sortable list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {columns.map(col => {
              const taskCount = tasks.filter(t => t.status === col.id).length
              const colDot = COLUMN_COLORS[col.colorKey].dot

              if (editingId === col.id) {
                return (
                  <SortableColRow key={col.id} col={col}>
                    <div className="flex-1 space-y-3 py-1">
                      <input
                        autoFocus
                        type="text"
                        value={editForm.rotulo}
                        onChange={e => setEditForm(f => ({ ...f, rotulo: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                        maxLength={40}
                        className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                                   rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                      />
                      <ColColorPicker
                        value={editForm.colorKey}
                        onChange={c => setEditForm(f => ({ ...f, colorKey: c }))}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </SortableColRow>
                )
              }

              return (
                <SortableColRow key={col.id} col={col}>
                  <span className={`w-3 h-3 rounded-full shrink-0 ${colDot}`} />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {col.rotulo}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                  <button
                    onClick={() => startEdit(col)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
                               hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    aria-label="Editar coluna"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (columns.length <= 1) return
                      const confirmed = window.confirm(
                        taskCount > 0
                          ? `Excluir "${col.rotulo}"? As ${taskCount} tarefas serão movidas para outra coluna.`
                          : `Excluir a coluna "${col.rotulo}"?`,
                      )
                      if (confirmed) deleteColumn(col.id)
                    }}
                    disabled={columns.length <= 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Excluir coluna"
                    title={isDefault(col.id) ? 'Coluna padrão' : undefined}
                  >
                    <Trash2 size={13} />
                  </button>
                </SortableColRow>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableColRow({
  col,
  children,
}: {
  col: KanbanCol
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border
                  border-gray-200 dark:border-gray-700 px-3 py-2.5 transition-shadow
                  ${isDragging ? 'shadow-lg opacity-70 z-50' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400
                   cursor-grab active:cursor-grabbing transition-colors touch-none shrink-0"
        aria-label="Arrastar coluna"
      >
        <GripVertical size={15} />
      </button>
      {children}
    </div>
  )
}

// ─── Tags tab ────────────────────────────────────────────────────────────────
function EtiquetasTab() {
  const { tags, addTag, updateTag, deleteTag } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; color: TagColor }>({
    name: '',
    color: 'indigo',
  })
  const [isAdding, setIsAdding] = useState(false)
  const [newForm, setNewForm] = useState<{ name: string; color: TagColor }>({
    name: '',
    color: 'indigo',
  })

  function startEdit(tag: TagType) {
    setEditingId(tag.id)
    setEditForm({ name: tag.name, color: tag.color })
  }

  function saveEdit() {
    if (!editingId || !editForm.name.trim()) return
    updateTag(editingId, { name: editForm.name.trim().toLowerCase(), color: editForm.color })
    setEditingId(null)
  }

  function handleAdd() {
    const name = newForm.name.trim().toLowerCase()
    if (!name) return
    if (tags.some(t => t.name === name)) return
    addTag({ name, color: newForm.color })
    setNewForm({ name: '', color: 'indigo' })
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gerencie as etiquetas disponíveis para classificar suas tarefas.
        </p>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400
                     hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} /> Nova etiqueta
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Nova etiqueta
          </p>
          <input
            autoFocus
            type="text"
            value={newForm.name}
            onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false) }}
            placeholder="Nome da etiqueta"
            maxLength={30}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                       rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
          />
          <TagColorPicker value={newForm.color} onChange={c => setNewForm(f => ({ ...f, color: c }))} />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Tag list */}
      <div className="space-y-2">
        {tags.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">
            Nenhuma etiqueta cadastrada.
          </p>
        )}
        {tags.map(tag => {
          const { dot, chipClass } = TAG_COLORS[tag.color]

          if (editingId === tag.id) {
            return (
              <div
                key={tag.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 px-4 py-3 space-y-3"
              >
                <input
                  autoFocus
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                  maxLength={30}
                  className="w-full px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                />
                <TagColorPicker
                  value={editForm.color}
                  onChange={c => setEditForm(f => ({ ...f, color: c }))}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={tag.id}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border
                         border-gray-200 dark:border-gray-700 px-4 py-2.5
                         hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <span className={`w-3 h-3 rounded-full shrink-0 ${dot}`} />
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${chipClass}`}>
                {tag.name}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => startEdit(tag)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
                             hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  aria-label="Editar etiqueta"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Excluir a etiqueta "${tag.name}"? Ela será removida de todas as tarefas.`))
                      deleteTag(tag.id)
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  aria-label="Excluir etiqueta"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Dados tab ───────────────────────────────────────────────────────────────
function DadosTab() {
  const { tasks, columns, tags, replaceAllData, deduplicateTasks, showToast } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      columns,
      tags,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskflow-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Backup exportado com sucesso!')
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data.tasks)) throw new Error('invalid')
        const confirmed = window.confirm(
          `Importar ${data.tasks.length} tarefa(s)?\n\nOs dados atuais (${tasks.length} tarefas) serão substituídos. Esta ação não pode ser desfeita.`,
        )
        if (!confirmed) return
        replaceAllData({
          tasks: data.tasks,
          columns: Array.isArray(data.columns) && data.columns.length > 0 ? data.columns : columns,
          tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : tags,
        })
        showToast(`${data.tasks.length} tarefa(s) importada(s) com sucesso!`)
      } catch {
        showToast('Arquivo inválido ou corrompido.', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const rowClass =
    'bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3'
  const btnOutline =
    'flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 ' +
    'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 ' +
    'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Tarefas', value: tasks.length, cls: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
          { label: 'Colunas', value: columns.length, cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: 'Etiquetas', value: tags.length, cls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls.split(' ').slice(0, 2).join(' ')}`}>
            <p className={`text-2xl font-bold ${s.cls.split(' ').slice(2).join(' ')}`}>{s.value}</p>
            <p className="text-xs mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className={rowClass}>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Exportar backup</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Baixa um arquivo <code className="font-mono">.json</code> com todas as tarefas, colunas e etiquetas. Use antes de limpar o storage do navegador.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                     bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          <Download size={14} /> Exportar .json
        </button>
      </div>

      {/* Import */}
      <div className={rowClass}>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Importar backup</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Restaura um arquivo <code className="font-mono">.json</code> exportado anteriormente. Os dados atuais serão substituídos.
          </p>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className={btnOutline}>
          <Upload size={14} /> Importar arquivo
        </button>
      </div>

      {/* Deduplicate */}
      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800/40 space-y-3">
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Limpar duplicatas</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            Remove tarefas com IDs duplicados, mantendo a primeira ocorrência de cada uma.
          </p>
        </div>
        <button
          onClick={deduplicateTasks}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                     text-amber-700 dark:text-amber-400 bg-white dark:bg-gray-800
                     border border-amber-300 dark:border-amber-700
                     hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
        >
          <Trash2 size={14} /> Remover duplicatas
        </button>
      </div>
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────────────
type SettingsTab = 'pipeline' | 'etiquetas' | 'dados'

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen } = useApp()
  const [tab, setTab] = useState<SettingsTab>('pipeline')
  const panelRef = useModalBehavior<HTMLDivElement>(() => setIsSettingsOpen(false))

  if (!isSettingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsSettingsOpen(false)}
      />

      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200
                   dark:border-gray-700 w-full max-w-xl max-h-[88dvh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 id="settings-title" className="text-base font-semibold text-gray-900 dark:text-white">
            Configurações
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Fechar configurações"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            { id: 'pipeline', label: 'Pipeline', icon: <Layers size={15} /> },
            { id: 'etiquetas', label: 'Etiquetas', icon: <Tag size={15} /> },
            { id: 'dados', label: 'Dados', icon: <Database size={15} /> },
          ] as { id: SettingsTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 shrink-0 px-1 py-3 text-sm font-medium mr-5 sm:mr-6 transition-colors ${
                tab === t.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.icon} {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="settings-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === 'pipeline' && <PipelineTab />}
              {tab === 'etiquetas' && <EtiquetasTab />}
              {tab === 'dados' && <DadosTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
