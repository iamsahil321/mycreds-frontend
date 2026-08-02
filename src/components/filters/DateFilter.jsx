import { seed, todayIso } from '../../data/seed.js';
import { addDays, formatMonthOption, monthEnd } from '../../lib/money.jsx';

export function DateFilter({ filters = seed.filters, months, t, onChange }) {
  const currentMonth = todayIso.slice(0, 7);
  const monthOptions = [...new Set([currentMonth, filters.month, ...months].filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const setPreset = (preset) => {
    if (preset === 'month') {
      const month = currentMonth;
      onChange({ ...filters, preset, month, from: `${month}-01`, to: monthEnd(month) });
      return;
    }
    if (preset === 'last30') {
      onChange({ ...filters, preset, from: addDays(todayIso, -29), to: todayIso });
      return;
    }
    if (preset === 'all') {
      onChange({ ...filters, preset, from: '', to: '' });
      return;
    }
    onChange({ ...filters, preset });
  };

  const setMonth = (month) => {
    onChange({ ...filters, preset: 'month', month, from: `${month}-01`, to: monthEnd(month) });
  };

  return (
    <section className="filterBar" aria-label={t('filter')}>
      <div className="segmented">
        {[
          ['month', t('thisMonth')],
          ['last30', t('last30')],
          ['all', t('allTime')],
          ['custom', t('custom')],
        ].map(([value, label]) => (
          <button key={value} className={filters.preset === value && (value !== 'month' || filters.month === currentMonth) ? 'selected' : ''} onClick={() => setPreset(value)}>
            {label}
          </button>
        ))}
      </div>
      <label>
        <span>{t('month')}</span>
        <select value={filters.month || currentMonth} onChange={(event) => setMonth(event.target.value)}>
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {formatMonthOption(month)}
            </option>
          ))}
        </select>
      </label>
      {filters.preset === 'custom' && (
        <>
          <label>
            <span>{t('from')}</span>
            <input type="date" value={filters.from || ''} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
          </label>
          <label>
            <span>{t('to')}</span>
            <input type="date" value={filters.to || ''} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
          </label>
        </>
      )}
    </section>
  );
}
