import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatInr, signedInr } from '../../lib/format.js';

export function UdharRow({ item, locale, t }) {
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
      <b className={item.balance >= 0 ? 'positive' : 'negative'}>{signedInr(item.balance, locale)}</b>
    </article>
  );
}
