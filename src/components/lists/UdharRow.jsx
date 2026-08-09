import { Pencil } from 'lucide-react';
import { formatInr } from '../../lib/format.js';

function formatAccountName(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function UdharRow({ account, locale, t, selected, onOpen, onEdit }) {
  const balance = account.totalBalance || 0;
  const displayName = formatAccountName(account.name);
  const statusLabel = balance > 0 ? t('youWillReceive') : balance < 0 ? t('youOwe') : t('settled');
  const metaParts = [];

  if (account.transactionCount > 0) {
    metaParts.push(`${account.transactionCount} ${t('ledgerEntries')}`);
    metaParts.push(`${t('interestRate')} ${account.monthlyInterestRate ? `${account.monthlyInterestRate}%` : t('notSet')}`);
    metaParts.push(`${t('accruedInterest')} ${formatInr(account.accruedInterest?.amount || 0, locale)}`);
  } else {
    metaParts.push(t('noLedgerEntriesYet'));
  }

  return (
    <article className={selected ? 'dataRow udharDataRow selected' : 'dataRow udharDataRow'}>
      <button className="udharAccountCard" onClick={() => onOpen(account)} aria-label={`${t('openLedger')} ${account.name}`}>
        <div className="rowMainButton">
          <div className="udharCardHeader">
            <div className="udharIdentityBlock">
              <div className="udharNameLine">
                <strong>{displayName}</strong>
              </div>
              {account.phone ? <span className="udharPhoneLine">{account.phone}</span> : null}
            </div>
            <div className="amountCell">
              <small>{statusLabel}</small>
              <b className={balance > 0 ? 'positive' : balance < 0 ? 'negative' : ''}>{formatInr(Math.abs(balance), locale)}</b>
            </div>
          </div>
          <div className={account.transactionCount > 0 ? 'udharMetaSummary' : 'udharMetaSummary quiet'}>
            {metaParts.map((part, index) => (
              <span key={`${account.id}-${index}`}>{part}</span>
            ))}
          </div>
        </div>
      </button>
      <div className="rowQuickActions visible">
        <button className="iconOnlyBtn" aria-label={`${t('edit')} ${account.name}`} title={t('edit')} onClick={() => onEdit(account)}>
          <Pencil aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
