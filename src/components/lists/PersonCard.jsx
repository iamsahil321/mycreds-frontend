import { signedInr } from '../../lib/format.js';

export function PersonCard({ item, t, locale }) {
  return (
    <article className="personCard">
      <span>{item.name}</span>
      <strong className={(item.totalBalance || 0) >= 0 ? 'positive' : 'negative'}>{signedInr(item.totalBalance || 0, locale)}</strong>
      <em>{item.status === 'settled' ? t('settled') : item.totalBalance >= 0 ? t('youGet') : t('youOwe')}</em>
    </article>
  );
}
