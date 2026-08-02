import { useState } from 'react';
import { Save } from 'lucide-react';
import { categories } from '../data/categories.js';
import { Field, Modal } from '../components/ui/index.js';

export function ExpenseModal({ t, label, onClose, onSave, onUdhar }) {
  const [linkUdhar, setLinkUdhar] = useState(false);

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
    if (linkUdhar && data.get('person')) {
      await onUdhar({ person: data.get('person'), phone: '', direction: 'given', amount: payload.amount, note: payload.note, date: payload.date });
    }
    onClose();
  }

  return (
    <Modal title={t('addExpense')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('amount')}>
          <input name="amount" required type="number" min="1" placeholder="500" />
        </Field>
        <Field label={t('category')}>
          <select name="category">
            {categories.map((item) => (
              <option key={item.key} value={item.key}>
                {label(item.key)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('note')}>
          <input name="note" required placeholder="Lunch, kirana, rent..." />
        </Field>
        <div className="formGrid">
          <Field label={t('payment')}>
            <select name="mode">
              <option>UPI</option>
              <option>Cash</option>
              <option>Card</option>
            </select>
          </Field>
          <Field label={t('date')}>
            <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
        <label className="check">
          <input type="checkbox" checked={linkUdhar} onChange={(event) => setLinkUdhar(event.target.checked)} /> Add as Diya in Udhar
        </label>
        {linkUdhar && (
          <Field label={t('person')}>
            <input name="person" placeholder="Rahul" />
          </Field>
        )}
        <button className="primaryBtn full iconBtn">
          <Save aria-hidden="true" />
          {t('save')}
        </button>
      </form>
    </Modal>
  );
}
