import { Save } from 'lucide-react';
import { Field, Modal } from '../components/ui/index.js';

export function UserModal({ t, user, onClose, onSave }) {
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onSave(
      {
        name: data.get('name'),
        email: data.get('email'),
        role: data.get('role'),
        password: data.get('password'),
      },
      user?.id
    );
    onClose();
  }

  return (
    <Modal title={user ? t('editUser') : t('addUser')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('name')}>
          <input name="name" required defaultValue={user?.name || ''} />
        </Field>
        <Field label={t('email')}>
          <input name="email" type="email" required defaultValue={user?.email || ''} />
        </Field>
        <Field label={t('role')}>
          <select name="role" defaultValue={user?.role === 'admin' ? 'admin' : 'user'}>
            <option value="user">{t('user')}</option>
            <option value="admin">{t('admin')}</option>
          </select>
        </Field>
        <Field label={user ? t('newPassword') : t('password')}>
          <input name="password" type="password" required={!user} minLength="8" placeholder={user ? t('leaveBlankPassword') : 'ChangeMe123!'} />
        </Field>
        <button className="primaryBtn full iconBtn">
          <Save aria-hidden="true" />
          {t('save')}
        </button>
      </form>
    </Modal>
  );
}
