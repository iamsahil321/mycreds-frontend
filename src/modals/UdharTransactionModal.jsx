import { Save } from 'lucide-react';
import { Field, Modal } from '../components/ui/index.js';

export function UdharTransactionModal({ t, transaction, account, onClose, onSave }) {
  const isEditing = Boolean(transaction);

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
    <Modal title={isEditing ? t('editLedgerEntry') : t('addLedgerEntry')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('person')}>
          <input value={account.name} readOnly />
        </Field>
        <div className="directionGrid">
          {[
            ['debit', t('youGave')],
            ['credit', t('youGot')],
          ].map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="type" value={value} defaultChecked={(transaction?.type || 'debit') === value} />
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
