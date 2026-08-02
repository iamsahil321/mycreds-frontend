import { X } from 'lucide-react';

export function Modal({ title, children, onClose }) {
  return (
    <div className="modalBackdrop" role="presentation">
      <div className="modal modalCard" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalHead">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
