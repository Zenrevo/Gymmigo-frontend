export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'warning' | 'danger';
};

export type PendingConfirm = ConfirmOptions & { resolve: (ok: boolean) => void };
let push: ((p: PendingConfirm) => void) | null = null;

/** Used by <DialogHost/> to receive confirm requests. */
export function setConfirmHost(fn: ((p: PendingConfirm) => void) | null) {
  push = fn;
}

/** Imperative confirm (like the app's `dialog()`): `if (await confirmDialog({...})) …`. Needs <DialogHost/>. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    if (!push) {
      resolve(window.confirm(options.message ? `${options.title}\n\n${options.message}` : options.title));
      return;
    }
    push({ ...options, resolve });
  });
}
