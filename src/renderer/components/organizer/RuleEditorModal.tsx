import React, { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { OrganizerRule, RuleCondition, RuleAction } from '../../../shared/types'

interface RuleEditorModalProps {
  rule?: OrganizerRule | null
  onClose: () => void
  onSave: (rule: Omit<OrganizerRule, 'id'>) => void
}

export default function RuleEditorModal({ rule, onClose, onSave }: RuleEditorModalProps) {
  const [name, setName] = useState(rule?.name || 'New Sorting Rule')
  const [action, setAction] = useState<RuleAction>(rule?.action || 'move')
  const [destination, setDestination] = useState(rule?.destination || '{type}/{year}')
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(rule?.logicOperator || 'AND')
  const [conditions, setConditions] = useState<RuleCondition[]>(
    rule?.conditions || [{ id: '1', field: 'extension', operator: 'contains', value: 'pdf,docx' }]
  )

  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'name', operator: 'contains', value: '' },
    ])
  }

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      enabled: true,
      conditions,
      logicOperator,
      action,
      destination,
      priority: rule?.priority || 1,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-xl rounded-2xl p-6 space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60 pb-3">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            {rule ? 'Edit Rule' : 'Create Sorting Rule'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
              Rule Name:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Action:
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-medium"
              >
                <option value="move">Move File</option>
                <option value="copy">Copy File</option>
                <option value="delete">Move to Trash</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                Destination Pattern:
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="glass-input w-full rounded-xl px-3.5 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* Conditions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Rule Conditions ({logicOperator} logic):
              </label>
              <button
                type="button"
                onClick={handleAddCondition}
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Condition</span>
              </button>
            </div>

            {conditions.map((cond, idx) => (
              <div key={cond.id} className="flex items-center gap-2">
                <select
                  value={cond.field}
                  onChange={(e) => {
                    const newField = e.target.value as any
                    setConditions((cs) => cs.map((c) => (c.id === cond.id ? { ...c, field: newField } : c)))
                  }}
                  className="glass-input rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="extension">Extension</option>
                  <option value="name">File Name</option>
                  <option value="size">File Size</option>
                  <option value="createdDate">Created Date</option>
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => {
                    const newOp = e.target.value as any
                    setConditions((cs) => cs.map((c) => (c.id === cond.id ? { ...c, operator: newOp } : c)))
                  }}
                  className="glass-input rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                </select>

                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => {
                    const val = e.target.value
                    setConditions((cs) => cs.map((c) => (c.id === cond.id ? { ...c, value: val } : c)))
                  }}
                  className="glass-input flex-1 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  placeholder="Value..."
                />

                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="text-gray-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200/60 dark:border-gray-800/60 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
