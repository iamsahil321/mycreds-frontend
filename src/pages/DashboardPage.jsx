import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { palette } from '../data/theme.js';
import { formatInr } from '../lib/format.js';
import { ChartTooltip, List, Metric, PanelHeader } from '../components/ui/index.js';
import { ExpenseRow, PersonCard } from '../components/lists/index.js';

export function DashboardPage({ state, metrics, reportData, t, label, onRouteChange }) {
  return (
    <div className="stack">
      <section className="metricGrid">
        <Metric title={t('spent')} value={formatInr(metrics.spent, state.locale)} tone="primary" />
        <Metric title={t('budgetLeft')} value={formatInr(Math.max(metrics.budgetLeft, 0), state.locale)} tone={metrics.budgetLeft < 0 ? 'error' : 'success'} />
        <Metric title={t('youGet')} value={formatInr(metrics.receivable, state.locale)} tone="success" />
        <Metric title={t('youOwe')} value={formatInr(metrics.payable, state.locale)} tone="error" />
      </section>

      <div className="contentGrid">
        <section className="panel tall">
          <PanelHeader title={t('monthlyPulse')} action={t('reports')} onClick={() => onRouteChange('reports')} />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={reportData.trend}>
              <defs>
                <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={palette.primary} stopOpacity={0.26} />
                  <stop offset="95%" stopColor={palette.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e5eaf0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip locale={state.locale} />} />
              <Area type="monotone" dataKey="spent" stroke={palette.primary} strokeWidth={3} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <PanelHeader title={t('recentExpenses')} action={t('expenses')} onClick={() => onRouteChange('expenses')} />
          <List>
            {state.expenses
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((item) => (
                <ExpenseRow key={item.id} item={item} label={label} locale={state.locale} />
              ))}
          </List>
        </section>
      </div>

      <section className="panel">
        <PanelHeader title={t('udharPeople')} action={t('udhar')} onClick={() => onRouteChange('udhar')} />
        <div className="peopleGrid">
          {metrics.udharBalances.map((item) => (
            <PersonCard item={item} t={t} locale={state.locale} key={item.person} />
          ))}
        </div>
      </section>
    </div>
  );
}
