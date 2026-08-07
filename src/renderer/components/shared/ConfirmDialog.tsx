import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: 'default' | 'danger'
  children?: React.ReactNode
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </Dialog.Description>
          )}
          {children}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-primary-500 hover:bg-primary-600'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
