import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmText?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: 'default' | 'danger'
  children?: React.ReactNode
}

export default function ConfirmDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  const isDialogOpen = open !== undefined ? open : (isOpen ?? false)

  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  const finalConfirmLabel = confirmText || confirmLabel || 'Confirm'

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={(val) => !val && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card rounded-2xl p-6 w-full max-w-md z-50 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-bold text-gray-900 dark:text-white">
              {title}
            </Dialog.Title>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {description && (
            <Dialog.Description className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </Dialog.Description>
          )}

          {children}

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                handleClose()
              }}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {finalConfirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
