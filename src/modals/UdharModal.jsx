import { useState } from 'react';
import { Save } from 'lucide-react';
import { Field, Modal } from '../components/ui/index.js';
import { formatInr } from '../lib/format.js';
import { calculateClosing } from '../lib/money.jsx';

export function UdharModal({ t, balances, locale, entry, onClose, onSave }) {
  const [person, setPerson] = useState(entry?.person || '');
  const [direction, setDirection] = useState(entry?.direction || 'given');
  const [dueDate, setDueDate] = useState(entry?.dueDate || '');
  const [interestRate, setInterestRate] = useState(entry?.interestRate || 0);
  const [amount, setAmount] = useState(entry?.amount ? String(entry.amount) : '');
  const isEditing = Boolean(entry);
  const selectedBalance = balances.find((item) => item.person.toLowerCase() === person.trim().toLowerCase());
  const isSettlement = direction === 'settle_taken' || direction === 'settle_given';
  const closing = selectedBalance ? calculateClosing(selectedBalance.balance, dueDate || selectedBalance.dueDate, Number(interestRate || 0)) : null;

  const handlePersonChange = (value) => {
    setPerson(value);
    const match = balances.find((item) => item.person.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setDueDate(match.dueDate || '');
      setInterestRate(match.interestRate || 0);
      if (direction === 'settle_taken' || direction === 'settle_given') {
        setAmount(String(Math.ceil(match.closing.total)));
      }
    }
  };

  const handleDirectionChange = (value) => {
    setDirection(value);
    if ((value === 'settle_taken' || value === 'settle_given') && selectedBalance) {
      setAmount(String(Math.ceil(calculateClosing(selectedBalance.balance, dueDate || selectedBalance.dueDate, Number(interestRate || 0)).total)));
    }
  };

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onSave({
      person,
      phone: data.get('phone'),
      direction,
      amount: Number(amount),
      note: data.get('note'),
      date: data.get('date'),
      dueDate,
      interestRate: Number(interestRate || 0),
    });
    onClose();
  }

  return (
    <Modal title={isEditing ? t('editUdhar') : t('addUdhar')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('person')}>
          <input name="person" required placeholder={t('savedContactHint')} value={person} onChange={(event) => handlePersonChange(event.target.value)} />
        </Field>
        <Field label={t('phone')}>
          <input name="phone" inputMode="tel" placeholder="9876543210" defaultValue={entry?.phone || ''} />
        </Field>
        <div className="directionGrid">
          {[
            ['given', t('diya')],
            ['taken', t('liya')],
            ['settle_taken', t('theyPaid')],
            ['settle_given', t('youPaid')],
          ].map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="direction" value={value} checked={direction === value} onChange={() => handleDirectionChange(value)} />
              {label}
            </label>
          ))}
        </div>
        <div className="formGrid">
          <Field label={t('dueDate')}>
            <input name="dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
          <Field label={t('interestRate')}>
            <input name="interestRate" type="number" min="0" step="0.1" value={interestRate} onChange={(event) => setInterestRate(event.target.value)} />
          </Field>
        </div>
        {isSettlement && selectedBalance && (
          <div className="closingBox">
            <div>
              <span>{t('principal')}</span>
              <strong>{formatInr(closing.principal, locale)}</strong>
            </div>
            <div>
              <span>{t('interest')}</span>
              <strong>{formatInr(closing.interest, locale)}</strong>
            </div>
            <div>
              <span>{closing.daysOverdue > 0 ? `${closing.daysOverdue} ${t('daysLate')}` : t('noInterest')}</span>
              <strong>{formatInr(closing.total, locale)}</strong>
            </div>
            <p>{t('closingAmount')}</p>
          </div>
        )}
        <div className="formGrid">
          <Field label={t('amount')}>
            <input
              name="amount"
              required
              type="number"
              min="1"
              placeholder={closing ? String(Math.ceil(closing.total)) : '500'}
              value={isSettlement && closing ? String(Math.ceil(closing.total)) : amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label={t('date')}>
            <input name="date" type="date" required defaultValue={entry?.date || new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>
        <Field label={t('note')}>
          <input name="note" placeholder="Trip, repayment..." defaultValue={entry?.note || ''} />
        </Field>
        <button className="primaryBtn full iconBtn">
          <Save aria-hidden="true" />
          {t('save')}
        </button>
      </form>
    </Modal>
  );
}
