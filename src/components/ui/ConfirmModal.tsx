'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
  children,
}: ConfirmModalProps) {

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-critical)' }} />,
          // Flag: no --danger-bg token exists in locked system; using bg-card as nearest token.
          iconBg: 'bg-card',
          buttonClass: 'bg-status-critical text-primary-fg hover:opacity-90',
        };
      case 'warning':
        return {
          // Flag: --status-pending is the nearest token to a warning state.
          icon: <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-pending)' }} />,
          iconBg: 'bg-card',
          buttonClass: 'bg-status-pending text-primary-fg hover:opacity-90',
        };
      case 'primary':
      default:
        return {
          icon: null,
          iconBg: '',
          buttonClass: 'bg-primary text-primary-fg hover:bg-primary-hover',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[100] bg-text-primary/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ backgroundColor: 'rgba(26,25,23,0.55)' }}
        />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-surface p-6 shadow-modal duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {styles.icon && (
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border ${styles.iconBg}`}>
                {styles.icon}
              </div>
            )}
            <div className="flex-1 space-y-1">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-relaxed text-text-secondary">
                {description}
              </Dialog.Description>
            </div>
          </div>

          {children}

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cancelLabel}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles.buttonClass}`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded p-1 text-text-secondary opacity-70 transition-opacity hover:opacity-100 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
