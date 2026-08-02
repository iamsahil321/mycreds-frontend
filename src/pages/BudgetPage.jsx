import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Bar, BarChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { categoryColors, palette } from '../data/theme.js';
import { formatInr } from '../lib/format.js';
import { budgetStatus, formatMonthOption, getMonthlyBudget, template } from '../lib/money.jsx';
import { ChartTooltip, Metric, PanelHeader } from '../components/ui/index.js';

export function BudgetPage({ state, onSaveBudget, metrics, reportData, month, t, locale }) {
  const currentBudget = getMonthlyBudget(state, month);
  const [budget, setBudget] = useState(currentBudget);
  const categoryPressure = reportData.category.slice(0, 8).map((item) => ({
    ...item,
    budgetShare: metrics.budget ? Math.round((item.amount / metrics.budget) * 100) : 0,
  }));

  useEffect(() => {
    setBudget(currentBudget);
  }, [currentBudget]);

  return (
    <div className="budgetPage">
      <section className="panel budgetHero">
        <div className="budgetHeroText">
          <p className="kicker">{formatMonthOption(month)}</p>
          <h3>{t('budgetPlan')}</h3>
          <p>{t('budgetSub')}</p>
        </div>
        <div className="budgetEditor">
          <label className="field">
            <span>{template(t('budgetForMonth'), { month: formatMonthOption(month) })}</span>
            <input value={budget} type="number" min="0" onChange={(event) => setBudget(Number(event.target.value))} />
          </label>
          <button className="primaryBtn iconBtn" onClick={() => onSaveBudget(month, budget)}>
            <Save aria-hidden="true" />
            {t('saveBudget')}
          </button>
        </div>
      </section>

      <section className="budgetSummaryGrid">
        <Metric title={t('spent')} value={formatInr(metrics.spent, locale)} tone="primary" />
        <Metric title={metrics.budgetLeft >= 0 ? t('left') : t('over')} value={formatInr(Math.abs(metrics.budgetLeft), locale)} tone={metrics.budgetLeft >= 0 ? 'success' : 'error'} />
        <Metric title={t('monthlyBudget')} value={formatInr(metrics.budget, locale)} tone="primary" />
        <Metric title={t('used')} value={`${Math.round(metrics.budgetUsed)}%`} tone={metrics.budgetUsed >= 100 ? 'error' : metrics.budgetUsed >= 80 ? 'warning' : 'success'} />
      </section>

      <div className="budgetGrid">
        <section className="panel budgetStatusPanel">
          <PanelHeader title={t('budgetHealth')} />
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart
              innerRadius="68%"
              outerRadius="100%"
              data={[{ name: 'used', value: Math.min(metrics.budgetUsed, 100), fill: metrics.budgetUsed > 100 ? palette.error : metrics.budgetUsed > 80 ? palette.warning : palette.success }]}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={12} background={{ fill: '#e9eef5' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="centerMetric budgetCenterMetric">
            <strong>{Math.round(metrics.budgetUsed)}%</strong>
            <span>{budgetStatus(metrics.budgetUsed, t)}</span>
          </div>
        </section>

        <section className="panel">
          <PanelHeader title={t('categoryPressure')} />
          <div className="budgetList">
            {categoryPressure.map((item, index) => (
              <div className="budgetCategoryRow" key={item.name}>
                <div>
                  <i style={{ background: categoryColors[index % categoryColors.length] }} />
                  <span>{item.name}</span>
                </div>
                <strong>{formatInr(item.amount, locale)}</strong>
                <small>{item.budgetShare}% {t('ofBudget')}</small>
                <div className="tinyTrack">
                  <i style={{ width: `${Math.min(item.budgetShare, 100)}%`, background: categoryColors[index % categoryColors.length] }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel budgetChartPanel">
          <PanelHeader title={t('topCategories')} />
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={reportData.category.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={118} />
              <Tooltip content={<ChartTooltip locale={locale} />} />
              <Bar dataKey="amount" fill={palette.primary} radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
