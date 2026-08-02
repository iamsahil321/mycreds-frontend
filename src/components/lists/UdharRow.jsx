import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BookOpenText, Pencil, Trash2 } from 'lucide-react';
import { formatInr, signedInr } from '../../lib/format.js';

export function UdharRow({ item, locale, t, onEdit, onDelete }) {
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const DirectionIcon = item.balance >= 0 ? ArrowDownLeft : ArrowUpRight;
  const entries = item.entries.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <article className="dataRow udharDataRow">
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
      <div className="amountCell">
        <b className={item.balance >= 0 ? 'positive' : 'negative'}>{signedInr(item.balance, locale)}</b>
        {(onEdit || onDelete) && (
          <button className="ledgerToggle" aria-label={t('ledger')} aria-expanded={isLedgerOpen} onClick={() => setIsLedgerOpen((open) => !open)}>
            <BookOpenText aria-hidden="true" />
            <span>{t('ledger')}</span>
          </button>
        )}
      </div>
      {isLedgerOpen && (
        <div className="ledgerPanel">
          {entries.map((entry) => (
            <div className="ledgerEntry" key={entry.id}>
              <div>
                <strong>{formatInr(entry.amount, locale)}</strong>
                <span>{entry.date} · {entry.note || entry.direction}</span>
              </div>
              <div className="rowQuickActions visible">
                <button className="iconOnlyBtn" aria-label={`Edit ${entry.person} ${entry.date}`} title={t('edit')} onClick={() => onEdit(entry)}>
                  <Pencil aria-hidden="true" />
                </button>
                <button className="iconOnlyBtn danger" aria-label={`Delete ${entry.person} ${entry.date}`} title={t('delete')} onClick={() => onDelete(entry)}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
