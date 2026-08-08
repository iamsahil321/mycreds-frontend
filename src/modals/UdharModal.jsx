import { Save } from 'lucide-react';
import { Field, Modal } from '../components/ui/index.js';

export function UdharModal({ t, account, onClose, onSave }) {
  const isEditing = Boolean(account);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onSave({
      name: data.get('name'),
      phone: data.get('phone'),
      monthlyInterestRate: Number(data.get('monthlyInterestRate') || 0),
      interestStartDate: data.get('interestStartDate'),
      openingBalance: isEditing ? undefined : Number(data.get('openingBalance') || 0),
      openingBalanceDate: data.get('openingBalanceDate'),
      notes: data.get('notes'),
    });
    onClose();
  }

  return (
    <Modal title={isEditing ? t('editUdharAccount') : t('addUdharAccount')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('person')}>
          <input name="name" required placeholder="Rahul Sharma" defaultValue={account?.name || ''} />
        </Field>
        <Field label={t('phone')}>
          <input name="phone" inputMode="tel" placeholder="9876543210" defaultValue={account?.phone || ''} />
        </Field>
        <div className="formGrid">
          <Field label={t('monthlyInterestRate')}>
            <input name="monthlyInterestRate" type="number" min="0" max="100" step="0.1" defaultValue={account?.monthlyInterestRate || 0} />
          </Field>
          <Field label={t('interestStartDate')}>
            <input name="interestStartDate" type="date" defaultValue={account?.interestStartDate || new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
        {!isEditing && (
          <div className="formGrid">
            <Field label={t('openingBalance')}>
              <input name="openingBalance" type="number" placeholder="0" defaultValue="0" />
            </Field>
            <Field label={t('openingBalanceDate')}>
              <input name="openingBalanceDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>
        )}
        <Field label={t('note')}>
          <input name="notes" placeholder={t('accountNoteHint')} defaultValue={account?.notes || ''} />
        </Field>
        <button className="primaryBtn full iconBtn">
          <Save aria-hidden="true" />
          {t('save')}
        </button>
      </form>
    </Modal>
  );
}
