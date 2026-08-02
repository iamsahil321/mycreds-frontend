import { UsersRound } from 'lucide-react';
import { List, PanelHeader } from '../components/ui/index.js';

export function UsersAdminPage({ users, currentUser, t, onAdd, onEdit, onDelete }) {
  return (
    <div className="stack">
      <section className="panel">
        <PanelHeader title={t('userManagement')} action={t('addUser')} onClick={onAdd} />
        <p className="panelSub">{t('userManagementSub')}</p>
        <List>
          {users.map((user) => (
            <article className="dataRow userRow" key={user.id}>
              <div className={user.role === 'admin' ? 'avatar receive' : 'avatar'}>
                <UsersRound aria-hidden="true" />
              </div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email} · {user.role === 'admin' ? t('admin') : t('user')}</span>
                <span>{t('lastLogin')}: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : t('noData')}</span>
              </div>
              <div className="rowActions">
                <button className="softBtn" onClick={() => onEdit(user)}>
                  {t('editUser')}
                </button>
                <button className="dangerBtn" disabled={user.id === currentUser?.id} onClick={() => onDelete(user.id)}>
                  {t('deleteUser')}
                </button>
              </div>
            </article>
          ))}
        </List>
      </section>
    </div>
  );
}
