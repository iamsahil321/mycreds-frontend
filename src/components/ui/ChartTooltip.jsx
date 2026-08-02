import { formatInr } from '../../lib/format.js';

export function ChartTooltip({ active, payload, label, locale }) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="tooltip">
      <b>{label || row.name}</b>
      <span>{formatInr(row.value, locale)}</span>
    </div>
  );
}
