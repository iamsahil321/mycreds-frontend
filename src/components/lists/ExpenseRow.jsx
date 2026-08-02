import { Landmark, Pencil, Trash2 } from 'lucide-react';
import { categoryIcons } from '../../data/categories.js';
import { formatInr } from '../../lib/format.js';

export function ExpenseRow({ item, label, locale, onEdit, onDelete }) {
  const CategoryIcon = categoryIcons[item.category] || Landmark;
  return (
    <article className="dataRow">
      <div className="avatar">
        <CategoryIcon aria-hidden="true" />
      </div>
      <div>
        <strong>{item.note}</strong>
        <span>{label(item.category)} · {item.mode} · {item.date}</span>
      </div>
      <div className="amountCell">
        <b className="negative">-{formatInr(item.amount, locale)}</b>
        {(onEdit || onDelete) && (
          <div className="rowQuickActions" aria-label={`${item.note} actions`}>
            {onEdit && (
              <button className="iconOnlyBtn" aria-label={`Edit ${item.note}`} title="Edit" onClick={() => onEdit(item)}>
                <Pencil aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button className="iconOnlyBtn danger" aria-label={`Delete ${item.note}`} title="Delete" onClick={() => onDelete(item)}>
                <Trash2 aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
