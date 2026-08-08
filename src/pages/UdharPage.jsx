import { Plus, Pencil, Trash2 } from 'lucide-react';
import { List, PanelHeader } from '../components/ui/index.js';
import { UdharRow } from '../components/lists/index.js';
import { formatInr, signedInr } from '../lib/format.js';

function transactionSign(transaction) {
  if (transaction.type === 'credit') return -Math.abs(transaction.amount);
  if (transaction.type === 'adjustment' || transaction.type === 'opening_balance') return Number(transaction.amount);
  return Math.abs(transaction.amount);
}

function transactionLabel(transaction, t) {
  if (transaction.type === 'debit') return t('youGave');
  if (transaction.type === 'credit') return t('youGot');
  if (transaction.type === 'interest') return t('interestPosted');
  if (transaction.type === 'opening_balance') return t('openingBalance');
  return t('adjustment');
}

export function UdharPage({ accounts, selectedAccountId, t, locale, onSelectAccount, onAddAccount, onEditAccount, onDeleteAccount, onAddTransaction, onEditTransaction, onDeleteTransaction }) {
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0];
  const transactions = selectedAccount?.transactions || [];

  return (
    <div className="udharAccountGrid">
      <section className="panel">
        <PanelHeader title={t('udharAccounts')} action={t('addAccount')} onClick={onAddAccount} />
        <List>
          {accounts.map((account) => (
            <UdharRow
              account={account}
              t={t}
              locale={locale}
              key={account.id}
              selected={selectedAccount?.id === account.id}
              onOpen={onSelectAccount}
              onEdit={onEditAccount}
              onDelete={onDeleteAccount}
            />
          ))}
        </List>
      </section>

      <section className="panel ledgerDetailPanel">
        {selectedAccount ? (
          <>
            <PanelHeader
              title={selectedAccount.name}
              action={t('addLedgerEntry')}
              onClick={() => onAddTransaction(selectedAccount)}
            />
            <div className="ledgerSummary">
              <div>
                <span>{t('currentBalance')}</span>
                <strong className={selectedAccount.totalBalance >= 0 ? 'positive' : 'negative'}>{signedInr(selectedAccount.totalBalance || 0, locale)}</strong>
              </div>
              <div>
                <span>{t('principal')}</span>
                <strong>{formatInr(selectedAccount.balance || 0, locale)}</strong>
              </div>
              <div>
                <span>{t('accruedInterest')}</span>
                <strong>{formatInr(selectedAccount.accruedInterest?.amount || 0, locale)}</strong>
              </div>
            </div>
            <div className="ledgerPanel accountLedgerPanel">
              {transactions.map((transaction) => (
                <div className="ledgerEntry" key={transaction.id}>
                  <div>
                    <strong className={transactionSign(transaction) >= 0 ? 'positive' : 'negative'}>{signedInr(transactionSign(transaction), locale)}</strong>
                    <span>
                      {transaction.date} · {transactionLabel(transaction, t)}
                      {transaction.note ? ` · ${transaction.note}` : ''}
                    </span>
                  </div>
                  <div className="rowQuickActions visible">
                    <button className="iconOnlyBtn" aria-label={`${t('edit')} ${transaction.date}`} title={t('edit')} onClick={() => onEditTransaction(selectedAccount, transaction)}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button className="iconOnlyBtn danger" aria-label={`${t('delete')} ${transaction.date}`} title={t('delete')} onClick={() => onDeleteTransaction(transaction)}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
              {!transactions.length && (
                <button className="emptyAction" onClick={() => onAddTransaction(selectedAccount)}>
                  <Plus aria-hidden="true" />
                  {t('addLedgerEntry')}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="emptyState">
            <strong>{t('noUdharAccounts')}</strong>
            <button className="primaryBtn iconBtn" onClick={onAddAccount}>
              <Plus aria-hidden="true" />
              {t('addAccount')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
