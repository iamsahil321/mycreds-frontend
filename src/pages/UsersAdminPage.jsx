export function UsersAdminPage({ users, currentUser, t, onAdd, onEdit, onDelete }) {
  return (
    <section className="usersPanel">
      <div className="usersToolbar">
        <span>{users.length} {t('users').toLowerCase()}</span>
        <button className="primaryBtn" onClick={onAdd}>
          {t('addUser')}
        </button>
      </div>
      <div className="usersList">
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
      </div>
    </section>
  );
}
