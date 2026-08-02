import { Landmark } from 'lucide-react';
import { categoryIcons } from '../../data/categories.js';
import { formatInr } from '../../lib/format.js';

export function ExpenseRow({ item, label, locale }) {
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
      <b className="negative">-{formatInr(item.amount, locale)}</b>
    </article>
  );
}
