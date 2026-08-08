import { ArrowDownLeft, ArrowUpRight, CircleCheck, Pencil, Trash2 } from 'lucide-react';
import { formatInr, signedInr } from '../../lib/format.js';

export function UdharRow({ account, locale, t, selected, onOpen, onEdit, onDelete }) {
  const balance = account.totalBalance || 0;
  const DirectionIcon = balance > 0 ? ArrowDownLeft : balance < 0 ? ArrowUpRight : CircleCheck;

  return (
    <article className={selected ? 'dataRow udharDataRow selected' : 'dataRow udharDataRow'}>
      <button className={balance > 0 ? 'avatar receive' : balance < 0 ? 'avatar owe' : 'avatar'} onClick={() => onOpen(account)} aria-label={`${t('openLedger')} ${account.name}`}>
        <DirectionIcon aria-hidden="true" />
      </button>
      <button className="rowMainButton" onClick={() => onOpen(account)}>
        <strong>{account.name}</strong>
        <span>
          {account.transactionCount || 0} {t('ledgerEntries')}
          {account.monthlyInterestRate ? ` · ${account.monthlyInterestRate}% ${t('monthlyInterest')}` : ''}
        </span>
        {account.accruedInterest?.amount > 0 && (
          <span>
            {t('accruedInterest')}: {formatInr(account.accruedInterest.amount, locale)}
          </span>
        )}
      </button>
      <div className="amountCell">
        <b className={balance >= 0 ? 'positive' : 'negative'}>{signedInr(balance, locale)}</b>
        <div className="rowQuickActions visible">
          <button className="iconOnlyBtn" aria-label={`${t('edit')} ${account.name}`} title={t('edit')} onClick={() => onEdit(account)}>
            <Pencil aria-hidden="true" />
          </button>
          <button className="iconOnlyBtn danger" aria-label={`${t('delete')} ${account.name}`} title={t('delete')} onClick={() => onDelete(account)}>
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
