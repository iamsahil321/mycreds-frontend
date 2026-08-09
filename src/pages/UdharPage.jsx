import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarCheck,
  CalendarClock,
  Calculator,
  CircleCheck,
  Equal,
  IndianRupee,
  Pencil,
  Percent,
  Plus,
  TrendingUp,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { List } from '../components/ui/index.js';
import { UdharRow } from '../components/lists/index.js';
import { formatInr, signedInr } from '../lib/format.js';

function transactionSign(transaction) {
  if (transaction.type === 'credit') return -Math.abs(transaction.amount);
  if (transaction.type === 'interest') return Number(transaction.amount);
  if (transaction.type === 'adjustment' || transaction.type === 'opening_balance') return Number(transaction.amount);
  return Math.abs(transaction.amount);
}

function initialLetters(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDisplayDate(value, locale) {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDaysIso(value, days) {
  const next = new Date(`${value}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return isoDate(next);
}

function formatDisplayDateTime(transaction, locale) {
  const source = transaction.createdAt || transaction.date;
  if (!source) return '';
  const date = new Date(source);
  const formatter = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: transaction.createdAt ? 'numeric' : undefined,
    minute: transaction.createdAt ? '2-digit' : undefined,
  });
  return formatter.format(date);
}

function transactionMetaLabel(transaction, t) {
  if (transaction.type === 'credit') return t('got');
  if (transaction.type === 'interest') return t('interest');
  if (transaction.type === 'adjustment') return t('adjustment');
  if (transaction.type === 'opening_balance') return t('openingBalance');
  return t('give');
}

function transactionTitle(transaction, t) {
  if (transaction.type === 'credit') return t('got');
  if (transaction.type === 'interest') return t('interestAccrued');
  if (transaction.type === 'adjustment') return t('adjustmentEntry');
  if (transaction.type === 'opening_balance') return t('openingBalance');
  return t('give');
}

function transactionIcon(transaction) {
  if (transaction.type === 'credit') return ArrowDown;
  if (transaction.type === 'interest') return Percent;
  if (transaction.type === 'adjustment') return Equal;
  return ArrowUp;
}

function getEffectiveTransactionDate(transaction, interestStartDate) {
  if (
    transaction.type === 'opening_balance'
    && interestStartDate
    && new Date(transaction.date).getTime() > new Date(interestStartDate).getTime()
  ) {
    return interestStartDate;
  }
  return transaction.date;
}

export function UdharPage({
  accounts,
  selectedAccountId,
  routeAccountId,
  t,
  locale,
  onBack,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onQuickTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [interestOpen, setInterestOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId || account.id === routeAccountId);
  const transactions = [...(selectedAccount?.transactions || [])].sort((first, second) => {
    const firstTime = new Date(first.createdAt || first.date).getTime();
    const secondTime = new Date(second.createdAt || second.date).getTime();
    return secondTime - firstTime;
  });
  const openingBalance = transactions.find((transaction) => transaction.type === 'opening_balance');
  const principal = Math.abs(selectedAccount?.balance || 0);
  const accruedInterest = selectedAccount?.accruedInterest?.amount || 0;
  const interestDays = selectedAccount?.accruedInterest?.days || 0;
  const interestToday = interestDays > 0 ? Math.round(accruedInterest / interestDays) : 0;
  const interestStart = selectedAccount?.interestStartDate || openingBalance?.date;
  const filterOptions = [
    ['all', t('allLedger')],
    ['debit', t('give')],
    ['credit', t('got')],
    ['interest', t('interest')],
    ['adjustment', t('adjustments')],
  ];
  let rollingBalance = selectedAccount?.totalBalance || 0;
  const allLedgerRows = transactions.map((transaction) => {
    const effectiveDate = getEffectiveTransactionDate(transaction, interestStart);
    const row = {
      ...transaction,
      effectiveDate,
      signedAmount: transactionSign(transaction),
      runningBalance: rollingBalance,
      title: transactionTitle(transaction, t),
      metaLabel: transactionMetaLabel(transaction, t),
      displayDate:
        transaction.type === 'opening_balance'
          ? formatDisplayDate(effectiveDate, locale)
          : formatDisplayDateTime(transaction, locale),
    };
    rollingBalance -= row.signedAmount;
    return row;
  });
  const ledgerRows = ledgerFilter === 'all' ? allLedgerRows : allLedgerRows.filter((transaction) => transaction.type === ledgerFilter);
  const statusLabel =
    (selectedAccount?.totalBalance || 0) > 0
      ? t('youWillReceive')
      : (selectedAccount?.totalBalance || 0) < 0
        ? t('youHaveToPay')
        : t('accountSettled');
  const statusSubline =
    (selectedAccount?.totalBalance || 0) !== 0
      ? `${formatInr(principal, locale)} ${t('principal').toLowerCase()} + ${formatInr(accruedInterest, locale)} ${t('interest').toLowerCase()}`
      : t('noOutstandingBalance');
  const interestSummary = [
    selectedAccount?.monthlyInterestRate ? `${selectedAccount.monthlyInterestRate}% ${t('perMonth')}` : null,
    t('dailyAccrual'),
    interestStart ? `${t('startedOn')} ${formatDisplayDate(interestStart, locale)}` : null,
  ]
    .filter(Boolean)
    .join(' • ');
  const todayIso = isoDate(new Date());
  const lastCalculation =
    selectedAccount?.monthlyInterestRate && interestStart
      ? todayIso
      : selectedAccount?.lastInterestPostedAt || interestStart;
  const nextCalculation = lastCalculation ? addDaysIso(lastCalculation, 1) : '';
  const interestMetrics = [
    [Percent, t('monthlyRate'), selectedAccount?.monthlyInterestRate ? `${selectedAccount.monthlyInterestRate}%` : t('notSet')],
    [Calculator, t('calculation'), t('daily')],
    [IndianRupee, t('currentPrincipal'), formatInr(principal, locale)],
    [TrendingUp, t('dailyEffectiveRate'), selectedAccount?.monthlyInterestRate ? `${(selectedAccount.monthlyInterestRate / 30).toFixed(4)}%` : t('notSet')],
    [CalendarCheck, t('interestAccruedToday'), formatInr(interestToday, locale)],
    [WalletCards, t('totalAccrued'), formatInr(accruedInterest, locale)],
    [CalendarCheck, t('lastCalculation'), lastCalculation ? formatDisplayDate(lastCalculation, locale) : t('notSet')],
    [CalendarClock, t('nextCalculation'), nextCalculation ? formatDisplayDate(nextCalculation, locale) : t('notSet')],
  ];

  if (selectedAccount) {
    return (
      <section className="udharDetailPage">
        <div className="udharDetailTopbar">
          <button className="backBtn" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            {t('backToAccounts')}
          </button>
          <div className="rowQuickActions visible">
            <button className="iconOnlyBtn" aria-label={`${t('edit')} ${selectedAccount.name}`} title={t('edit')} onClick={() => onEditAccount(selectedAccount)}>
              <Pencil aria-hidden="true" />
            </button>
            <button className="iconOnlyBtn danger" aria-label={`${t('delete')} ${selectedAccount.name}`} title={t('delete')} onClick={() => onDeleteAccount(selectedAccount)}>
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        </div>

        <section className="udharHero">
          <div className="udharHeroIdentity">
            <div className="udharHeroAvatar">{initialLetters(selectedAccount.name) || 'U'}</div>
            <div>
              <div className="udharHeroNameRow">
                <h3>{selectedAccount.name}</h3>
                <span className="udharHeroCheck" aria-label={t('activeAccount')} title={t('activeAccount')}>
                  <CircleCheck aria-hidden="true" />
                </span>
              </div>
              <p>{selectedAccount.phone || t('phoneNotAdded')}</p>
            </div>
          </div>
          <div className="udharHeroAmount">
            <span>{statusLabel}</span>
            <strong className={selectedAccount.totalBalance >= 0 ? 'positive' : 'negative'}>{formatInr(Math.abs(selectedAccount.totalBalance || 0), locale)}</strong>
            <small>{statusSubline}</small>
          </div>
          <p className="udharHeroMeta">{interestSummary}</p>
          <div className={interestOpen ? 'udharHeroDetails open' : 'udharHeroDetails'}>
            <button className="interestToggle inline" onClick={() => setInterestOpen((open) => !open)}>
              <span>{t('interestDetails')}</span>
              <b>{interestOpen ? t('hideDetails') : t('showDetails')}</b>
            </button>
            {interestOpen && (
              <div className="interestGrid compact">
                {interestMetrics.map(([Icon, labelText, valueText]) => (
                  <article key={labelText}>
                    <span className="interestIconBubble">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>{labelText}</span>
                    <strong>{valueText}</strong>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="ledgerFilterBar">
            {filterOptions.map(([value, label]) => (
              <button
                key={value}
                className={ledgerFilter === value ? 'ledgerChip selected' : 'ledgerChip'}
                onClick={() => setLedgerFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {ledgerRows.length ? (
            <div className="ledgerTableWrap">
              <table className="ledgerTable">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('note')}</th>
                    <th>{t('amount')}</th>
                    <th>{t('balance')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((transaction) => {
                    const Icon = transactionIcon(transaction);
                    return (
                      <tr key={transaction.id} className={transaction.type === 'interest' ? 'interestEntry' : undefined}>
                        <td>
                          <div className="ledgerDateLine">
                            <strong>{formatDisplayDate(transaction.effectiveDate || transaction.date, locale)}</strong>
                            <span className={transaction.type === 'interest' ? 'ledgerTypePill interest' : 'ledgerTypePill'}>
                              <Icon aria-hidden="true" />
                              {transaction.metaLabel}
                            </span>
                          </div>
                          <span>{transaction.displayDate}</span>
                        </td>
                        <td>
                          <strong>{transaction.title}</strong>
                          {transaction.note ? <span>{transaction.note}</span> : null}
                          {transaction.type === 'interest' ? <span>{t('automaticallyGenerated')}</span> : null}
                        </td>
                        <td>
                          <strong className={transaction.signedAmount >= 0 ? 'positive' : 'negative'}>{signedInr(transaction.signedAmount, locale)}</strong>
                        </td>
                        <td>
                          <strong>{signedInr(transaction.runningBalance, locale)}</strong>
                        </td>
                        <td>
                          <div className="tableActions">
                            <button className="iconOnlyBtn" aria-label={`${t('edit')} ${transaction.date}`} title={t('edit')} onClick={() => onEditTransaction(selectedAccount, transaction)}>
                              <Pencil aria-hidden="true" />
                            </button>
                            <button className="iconOnlyBtn danger" aria-label={`${t('delete')} ${transaction.date}`} title={t('delete')} onClick={() => onDeleteTransaction(transaction)}>
                              <Trash2 aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="ledgerMobileCards">
                {ledgerRows.map((transaction) => {
                  const Icon = transactionIcon(transaction);
                  return (
                    <article key={transaction.id} className={transaction.type === 'interest' ? 'ledgerMobileCard interestEntry' : 'ledgerMobileCard'}>
                      <div className="ledgerMobileTop">
                        <div>
                          <div className="ledgerDateLine">
                            <strong>{formatDisplayDate(transaction.effectiveDate || transaction.date, locale)}</strong>
                            <b className={transaction.type === 'interest' ? 'ledgerTypePill interest' : 'ledgerTypePill'}>
                              <Icon aria-hidden="true" />
                              {transaction.metaLabel}
                            </b>
                          </div>
                        </div>
                        <div className="ledgerMobileEnd">
                          <strong className={transaction.signedAmount >= 0 ? 'positive' : 'negative'}>{signedInr(transaction.signedAmount, locale)}</strong>
                          <div className="tableActions">
                            <button className="iconOnlyBtn" aria-label={`${t('edit')} ${transaction.date}`} title={t('edit')} onClick={() => onEditTransaction(selectedAccount, transaction)}>
                              <Pencil aria-hidden="true" />
                            </button>
                            <button className="iconOnlyBtn danger" aria-label={`${t('delete')} ${transaction.date}`} title={t('delete')} onClick={() => onDeleteTransaction(transaction)}>
                              <Trash2 aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {(transaction.note || transaction.type === 'interest') && (
                        <p>{transaction.note || t('automaticallyGenerated')}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="emptyState compactEmptyState">
              <strong>{t('noLedgerEntriesYet')}</strong>
              <p>{t('noLedgerEntriesHint')}</p>
              <button className="primaryBtn iconBtn" onClick={() => onQuickTransaction(selectedAccount, 'debit')}>
                <Plus aria-hidden="true" />
                {t('addFirstDebit')}
              </button>
            </div>
          )}
        </section>

        <div className={speedDialOpen ? 'speedDial open' : 'speedDial'}>
          <div className="speedDialActions">
            <button
              className="speedDialAction"
              onClick={() => {
                setSpeedDialOpen(false);
                onQuickTransaction(selectedAccount, 'credit');
              }}
            >
              <WalletCards aria-hidden="true" />
              <span>{t('got')}</span>
            </button>
            <button
              className="speedDialAction primary"
              onClick={() => {
                setSpeedDialOpen(false);
                onQuickTransaction(selectedAccount, 'debit');
              }}
            >
              <ArrowUp aria-hidden="true" />
              <span>{t('give')}</span>
            </button>
          </div>
          <button className="speedDialFab" aria-label={speedDialOpen ? t('close') : t('addLedgerEntry')} onClick={() => setSpeedDialOpen((open) => !open)}>
            {speedDialOpen ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="udharListPage">
      {accounts.length ? (
        <List>
          {accounts.map((account) => (
            <UdharRow
              account={account}
              t={t}
              locale={locale}
              key={account.id}
              selected={false}
              onOpen={onSelectAccount}
              onEdit={onEditAccount}
              onDelete={onDeleteAccount}
            />
          ))}
        </List>
      ) : (
        <div className="emptyState detailEmptyState">
          <strong>{t('noUdharAccounts')}</strong>
          <p>{t('udharListSub')}</p>
          <button className="primaryBtn iconBtn" onClick={onAddAccount}>
            <Plus aria-hidden="true" />
            {t('addAccount')}
          </button>
        </div>
      )}
    </section>
  );
}
