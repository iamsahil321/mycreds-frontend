import { useState } from 'react';
import { Save } from 'lucide-react';
import { categories } from '../data/categories.js';
import { Field, Modal } from '../components/ui/index.js';

export function ExpenseModal({ t, label, expense, onClose, onSave, onUdhar }) {
  const [linkUdhar, setLinkUdhar] = useState(false);
  const isEditing = Boolean(expense);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      amount: Number(data.get('amount')),
      category: data.get('category'),
      note: data.get('note'),
      mode: data.get('mode'),
      date: data.get('date'),
    };
    await onSave(payload);
    if (!isEditing && linkUdhar && data.get('person')) {
      await onUdhar({ person: data.get('person'), phone: '', direction: 'given', amount: payload.amount, note: payload.note, date: payload.date });
    }
    onClose();
  }

  return (
    <Modal title={isEditing ? t('editExpense') : t('addExpense')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('amount')}>
          <input name="amount" required type="number" min="1" placeholder="500" defaultValue={expense?.amount || ''} />
        </Field>
        <Field label={t('category')}>
          <select name="category" defaultValue={expense?.category || 'rent'}>
            {categories.map((item) => (
              <option key={item.key} value={item.key}>
                {label(item.key)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('note')}>
          <input name="note" required placeholder="Lunch, kirana, rent..." defaultValue={expense?.note || ''} />
        </Field>
        <div className="formGrid">
          <Field label={t('payment')}>
            <select name="mode" defaultValue={expense?.mode || 'UPI'}>
              <option>UPI</option>
              <option>Cash</option>
              <option>Card</option>
            </select>
          </Field>
          <Field label={t('date')}>
            <input name="date" type="date" required defaultValue={expense?.date || new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
        {!isEditing && (
          <>
            <label className="check">
              <input type="checkbox" checked={linkUdhar} onChange={(event) => setLinkUdhar(event.target.checked)} /> Add as Diya in Udhar
            </label>
            {linkUdhar && (
              <Field label={t('person')}>
                <input name="person" placeholder="Rahul" />
              </Field>
            )}
          </>
        )}
        <button className="primaryBtn full iconBtn">
          <Save aria-hidden="true" />
          {t('save')}
        </button>
      </form>
    </Modal>
  );
}
