import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { formatInr, signedInr } from '../../lib/format.js';

export function UdharRow({ item, locale, t, onEdit, onDelete }) {
  const DirectionIcon = item.balance >= 0 ? ArrowDownLeft : ArrowUpRight;
  return (
    <article className="dataRow">
      <div className={item.balance >= 0 ? 'avatar receive' : 'avatar owe'}>
        <DirectionIcon aria-hidden="true" />
      </div>
      <div>
        <strong>
          {item.person} {item.isOverdue && <small className="badge overdueBadge">{t('overdue')}</small>}
        </strong>
        <span>
          {item.entries.length} {t('entries')}
          {item.dueDate ? ` · ${t('due')} ${item.dueDate}` : ''}
          {item.interestRate ? ` · ${item.interestRate}% p.a.` : ''}
        </span>
        <span>
          {t('close')}: {formatInr(item.closing.total, locale)} ({formatInr(item.closing.principal, locale)} +{' '}
          {formatInr(item.closing.interest, locale)})
        </span>
      </div>
      <div className="udharRowSide">
        <b className={item.balance >= 0 ? 'positive' : 'negative'}>{signedInr(item.balance, locale)}</b>
        {(onEdit || onDelete) && (
          <div className="entryActionList">
            {item.entries.slice().sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
              <div className="entryActionRow" key={entry.id}>
                <span>{entry.date} · {formatInr(entry.amount, locale)}</span>
                <button className="iconOnlyBtn" aria-label={`Edit ${entry.person} ${entry.date}`} onClick={() => onEdit(entry)}>
                  <Pencil aria-hidden="true" />
                </button>
                <button className="iconOnlyBtn danger" aria-label={`Delete ${entry.person} ${entry.date}`} onClick={() => onDelete(entry)}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
