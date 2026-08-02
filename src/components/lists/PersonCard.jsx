import { formatInr, signedInr } from '../../lib/format.js';

export function PersonCard({ item, t, locale }) {
  return (
    <article className={item.isOverdue ? 'personCard overdueCard' : 'personCard'}>
      <span>{item.person}</span>
      <strong className={item.balance >= 0 ? 'positive' : 'negative'}>{signedInr(item.balance, locale)}</strong>
      {item.isOverdue && (
        <em>
          {t('overdue')} · {formatInr(item.closing.interest, locale)} {t('interest')}
        </em>
      )}
    </article>
  );
}
