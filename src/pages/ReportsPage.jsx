import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { categoryColors, palette } from '../data/theme.js';
import { formatInr } from '../lib/format.js';
import { budgetStatus, template } from '../lib/money.jsx';
import { ChartTooltip, PanelHeader } from '../components/ui/index.js';

export function ReportsPage({ reportData, metrics, t, locale }) {
  const insight = reportData.category[0];

  return (
    <div className="stack">
      <section className="reportHero">
        <div>
          <span>{t('spent')}</span>
          <strong>{formatInr(metrics.spent, locale)}</strong>
          <p>{budgetStatus(metrics.budgetUsed, t)} · {Math.round(metrics.budgetUsed)}% {t('budgetHealth').toLowerCase()}</p>
        </div>
        <ResponsiveContainer width="100%" height={132}>
          <AreaChart data={reportData.trend}>
            <defs>
              <linearGradient id="heroArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" hide />
            <YAxis hide />
            <Area type="monotone" dataKey="spent" stroke="#fff" strokeWidth={3} fill="url(#heroArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <div className="reportsGrid">
        <section className="panel chartPanel">
          <PanelHeader title={t('spendByCategory')} />
          <div className="donutLayout">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={reportData.category} dataKey="amount" nameKey="name" innerRadius={74} outerRadius={112} paddingAngle={2} cornerRadius={8}>
                  {reportData.category.map((entry, index) => (
                    <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip locale={locale} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legendList">
              {reportData.category.map((item, index) => (
                <div className="legendRow" key={item.name}>
                  <i style={{ background: categoryColors[index % categoryColors.length] }} />
                  <span>{item.name}</span>
                  <b>{formatInr(item.amount, locale)}</b>
                  <small>{item.share}%</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel chartPanel">
          <PanelHeader title={t('sixMonthTrend')} />
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={reportData.trend} barGap={6}>
              <CartesianGrid stroke="#e5eaf0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip locale={locale} />} />
              <Bar dataKey="spent" radius={[10, 10, 4, 4]}>
                {reportData.trend.map((entry, index) => (
                  <Cell key={entry.month} fill={index === reportData.trend.length - 1 ? palette.primary : '#90caf9'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="average" stroke={palette.warning} strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="reportsGrid three">
        <section className="panel">
          <PanelHeader title={t('budgetHealth')} />
          <ResponsiveContainer width="100%" height={220}>
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
          <div className="centerMetric">
            <strong>{Math.round(metrics.budgetUsed)}%</strong>
            <span>{budgetStatus(metrics.budgetUsed, t)}</span>
          </div>
        </section>

        <section className="panel">
          <PanelHeader title={t('paymentMix')} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportData.payment} layout="vertical" margin={{ left: 12, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="mode" type="category" axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTooltip locale={locale} />} />
              <Bar dataKey="amount" fill={palette.secondary} radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel insightPanel">
          <PanelHeader title={t('insights')} />
          <div className="insight">
            <span>01</span>
            <p>{insight ? template(t('largestInsight'), { category: insight.name, share: insight.share }) : t('noData')}</p>
          </div>
          <div className="insight">
            <span>02</span>
            <p>
              {metrics.budgetLeft >= 0
                ? template(t('leftInsight'), { amount: formatInr(metrics.budgetLeft, locale) })
                : template(t('overBudgetInsight'), { amount: formatInr(Math.abs(metrics.budgetLeft), locale) })}
            </p>
          </div>
          <div className="insight">
            <span>03</span>
            <p>
              {metrics.net >= 0
                ? template(t('netReceivableInsight'), { amount: formatInr(metrics.net, locale) })
                : template(t('netPayableInsight'), { amount: formatInr(Math.abs(metrics.net), locale) })}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
