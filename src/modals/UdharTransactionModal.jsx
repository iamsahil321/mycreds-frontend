import { Save } from 'lucide-react';
import { Field, Modal } from '../components/ui/index.js';

export function UdharTransactionModal({ t, transaction, account, initialType = 'debit', onClose, onSave }) {
  const isEditing = Boolean(transaction);
  const defaultType = transaction?.type || initialType;
  const modalTitle = isEditing ? t('editLedgerEntry') : defaultType === 'credit' ? t('addCredit') : t('addDebit');

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onSave({
      accountId: account.id,
      type: data.get('type'),
      amount: Number(data.get('amount')),
      date: data.get('date'),
      note: data.get('note'),
    });
    onClose();
  }

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('person')}>
          <input value={account.name} readOnly />
        </Field>
        <div className="directionGrid">
          {[
            ['debit', t('give')],
            ['credit', t('got')],
          ].map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="type" value={value} defaultChecked={defaultType === value} />
              {label}
            </label>
          ))}
        </div>
        <div className="formGrid">
          <Field label={t('amount')}>
            <input name="amount" required type="number" min="1" placeholder="500" defaultValue={transaction?.amount || ''} />
          </Field>
          <Field label={t('date')}>
            <input name="date" type="date" required defaultValue={transaction?.date || new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
        <Field label={t('note')}>
          <input name="note" placeholder="Bill, repayment..." defaultValue={transaction?.note || ''} />
        </Field>
        <button className="primaryBtn full iconBtn">
          <Save aria-hidden="true" />
          {t('save')}
        </button>
      </form>
    </Modal>
  );
}
