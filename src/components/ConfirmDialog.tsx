interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="dialog">
        <h3>{title}</h3>
        <p className="muted">{message}</p>
        <div className="dialog-actions">
          <button className="btn ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? 'btn danger' : 'btn primary'}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
