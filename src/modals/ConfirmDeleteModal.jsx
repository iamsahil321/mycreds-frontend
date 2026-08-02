import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/index.js';

export function ConfirmDeleteModal({ title, message, warning, confirmLabel, cancelLabel, onCancel, onConfirm }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirmBody">
        <div className="confirmIcon">
          <AlertTriangle aria-hidden="true" />
        </div>
        <div>
          <h4>{message}</h4>
          <p>{warning}</p>
        </div>
      </div>
      <div className="confirmActions">
        <button className="softBtn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="dangerBtn iconBtn" onClick={onConfirm}>
          <Trash2 aria-hidden="true" />
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
