import { Download } from 'lucide-react';
import { categories } from '../data/categories.js';
import { ExpenseRow } from '../components/lists/index.js';
import { List } from '../components/ui/index.js';

export function ExpensesPage({ expenses, filter, setFilter, t, label, locale }) {
  function exportCsv() {
    const rows = [['date', 'note', 'category', 'amount', 'payment'], ...expenses.map((item) => [item.date, item.note, label(item.category), item.amount, item.mode])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kharcha-expenses.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Category filter">
          <option value="all">{t('all')}</option>
          {categories.map((item) => (
            <option value={item.key} key={item.key}>
              {label(item.key)}
            </option>
          ))}
        </select>
        <button className="softBtn iconBtn" onClick={exportCsv}>
          <Download aria-hidden="true" />
          {t('exportCsv')}
        </button>
      </div>
      <List>
        {expenses.map((item) => (
          <ExpenseRow key={item.id} item={item} label={label} locale={locale} />
        ))}
      </List>
    </section>
  );
}
