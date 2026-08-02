import { List, PanelHeader } from '../components/ui/index.js';
import { UdharRow } from '../components/lists/index.js';

export function UdharPage({ balances, t, locale, onEdit, onDelete }) {
  return (
    <section className="panel">
      <PanelHeader title={t('udharPeople')} />
      <List>
        {balances.map((item) => (
          <UdharRow item={item} t={t} locale={locale} key={item.person} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </List>
    </section>
  );
}
