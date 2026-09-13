import React, { createContext, useCallback, useContext, useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  message: string;
  resolve: (confirmed: boolean) => void;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | undefined>(undefined);

/**
 * Promise-based replacement for `window.confirm`, matching the app's dark modal chrome instead
 * of an unstyleable native dialog. Renders at most one dialog at a time; a second `confirm()`
 * call while one is open queues by simply overwriting `pending` once the first resolves.
 */
export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, resolve, ...options });
    });
  }, []);

  const settle = useCallback(
    (confirmed: boolean) => {
      pending?.resolve(confirmed);
      setPending(null);
    },
    [pending],
  );

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={pending !== null}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        danger={pending?.danger}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = (): ConfirmFn => {
  const confirm = useContext(ConfirmDialogContext);
  if (!confirm) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return confirm;
};
