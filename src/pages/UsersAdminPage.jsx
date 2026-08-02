import { List, PanelHeader } from '../components/ui/index.js';

export function UsersAdminPage({ users, currentUser, t, onAdd, onEdit, onDelete }) {
  return (
    <section className="panel usersPanel">
      <PanelHeader title={t('users')} action={t('addUser')} onClick={onAdd} />
      <List>
        {users.map((user) => (
          <article className="userListRow" key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <span className={user.role === 'admin' ? 'rolePill adminRole' : 'rolePill'}>{user.role === 'admin' ? t('admin') : t('user')}</span>
            <div className="rowActions">
              <button className="softBtn" onClick={() => onEdit(user)}>
                {t('edit')}
              </button>
              <button className="dangerBtn" disabled={user.id === currentUser?.id} onClick={() => onDelete(user.id)}>
                {t('delete')}
              </button>
            </div>
          </article>
        ))}
      </List>
    </section>
  );
}
