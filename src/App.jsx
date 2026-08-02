import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Apple,
  BadgeIndianRupee,
  BriefcaseBusiness,
  BusFront,
  Calculator,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Download,
  Flame,
  Fuel,
  GraduationCap,
  HandCoins,
  HandHeart,
  HeartPulse,
  Home,
  IndianRupee,
  Landmark,
  Laptop,
  LayoutDashboard,
  Lightbulb,
  Milk,
  Plus,
  ReceiptText,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  Utensils,
  UsersRound,
  WalletCards,
  Wheat,
  Wifi,
  Wrench,
  X,
} from 'lucide-react';

import { palette, categoryColors } from './data/theme.js';
import { categories, categoryIcons, navIcons } from './data/categories.js';
import { dictionary } from './data/i18n.js';
import { seed, todayIso } from './data/seed.js';
import { apiUrl } from './lib/api.js';
import { formatInr, signedInr } from './lib/format.js';
import {
  addDays,
  budgetStatus,
  buildReports,
  calculateClosing,
  ChartTooltip,
  computeMetrics,
  Field,
  filterExpensesByDate,
  formatMonthOption,
  getActiveBudgetMonth,
  getExpenseMonths,
  getMonthlyBudget,
  monthEnd,
  template,
} from './lib/money.jsx';
import { IconSlot } from './components/IconSlot.jsx';

export default function App() {
  const [state, setState] = useState(seed);
  const [auth, setAuth] = useState({ status: 'checking', user: null, error: '' });
  const [dataStatus, setDataStatus] = useState('idle');
  const [syncError, setSyncError] = useState('');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [udharOpen, setUdharOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const t = (key) => dictionary[state.locale][key] || key;
  const isAdmin = auth.user?.role === 'admin' || auth.user?.role === 'owner';
  const tabs = isAdmin ? ['dashboard', 'expenses', 'budget', 'reports', 'udhar', 'users'] : ['dashboard', 'expenses', 'budget', 'reports', 'udhar'];
  const label = (key) => categories.find((item) => item.key === key)?.[state.locale] || key;
  const availableMonths = useMemo(() => getExpenseMonths(state.expenses), [state.expenses]);
  const activeBudgetMonth = getActiveBudgetMonth(state.filters);
  const filteredByDate = useMemo(() => filterExpensesByDate(state.expenses, state.filters), [state.expenses, state.filters]);

  const metrics = useMemo(() => computeMetrics(state, filteredByDate, activeBudgetMonth), [state, filteredByDate, activeBudgetMonth]);
  const reportData = useMemo(
    () => buildReports({ ...state, expenses: filteredByDate }, label, state.expenses, state.filters),
    [state, filteredByDate, state.locale]
  );

  useEffect(() => {
    let mounted = true;
    fetch(apiUrl('/api/auth/me'), { credentials: 'include' })
      .then(async (response) => {
        if (!mounted) return;
        if (!response.ok) {
          setAuth({ status: 'guest', user: null, error: '' });
          return;
        }
        const data = await response.json();
        setAuth({ status: 'authenticated', user: data.user, error: '' });
        await loadResourceState(mounted, data.user);
      })
      .catch(() => {
        if (mounted) setAuth({ status: 'guest', user: null, error: '' });
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function loadResourceState(mounted = true, user = auth.user) {
    if (!mounted) return;
    setDataStatus('loading');
    setSyncError('');
    try {
      const [settingsResponse, budgetsResponse, expensesResponse, udharResponse] = await Promise.all([
        fetch(apiUrl('/api/settings'), { credentials: 'include' }),
        fetch(apiUrl('/api/budgets'), { credentials: 'include' }),
        fetch(apiUrl('/api/expenses?limit=2000'), { credentials: 'include' }),
        fetch(apiUrl('/api/udhar?limit=2000'), { credentials: 'include' }),
      ]);
      const [settingsData, budgetsData, expensesData, udharData] = await Promise.all([
        settingsResponse.json().catch(() => ({})),
        budgetsResponse.json().catch(() => ({})),
        expensesResponse.json().catch(() => ({})),
        udharResponse.json().catch(() => ({})),
      ]);
      const failed = [settingsResponse, budgetsResponse, expensesResponse, udharResponse].find((response) => !response.ok);
      if (failed) throw new Error('Could not load app data.');
      if (!mounted) return;
      const settings = settingsData.data || {};
      const canUseAdminTab = user?.role === 'admin' || user?.role === 'owner';
      const budgets = Object.fromEntries((budgetsData.data || []).map((item) => [item.month, item.amount]));
      setState({
        ...seed,
        locale: settings.locale || seed.locale,
        tab: settings.defaultTab === 'users' && !canUseAdminTab ? 'dashboard' : settings.defaultTab || seed.tab,
        budgets,
        filters: { ...seed.filters, ...(settings.filters || {}) },
        expenses: expensesData.data || [],
        udhar: udharData.data || [],
      });
      if ((settings.defaultTab === 'users') && mounted) await loadUsers();
      setDataStatus('ready');
    } catch (error) {
      if (!mounted) return;
      setDataStatus('error');
      setSyncError(error.message || 'Could not load app data.');
    }
  }

  useEffect(() => {
    if (state.tab === 'users' && isAdmin) loadUsers();
  }, [state.tab, isAdmin]);

  async function apiRequest(path, options = {}) {
    setSyncError('');
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : options.headers,
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }

  async function login(credentials) {
    setAuth((prev) => ({ ...prev, status: 'checking', error: '' }));
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAuth({ status: 'guest', user: null, error: data.message || 'Login failed' });
      return;
    }
    setAuth({ status: 'authenticated', user: data.user, error: '' });
    await loadResourceState(true, data.user);
  }

  async function logout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    setAuth({ status: 'guest', user: null, error: '' });
    setDataStatus('idle');
    setState(seed);
  }

  function updateLocal(next) {
    setState((prev) => (typeof next === 'function' ? next(prev) : next));
  }

  async function saveSettings(patch) {
    if (patch.defaultTab === 'users' && !isAdmin) patch.defaultTab = 'dashboard';
    const currentSettings = {
      locale: state.locale,
      defaultTab: state.tab,
      filters: state.filters,
      ...patch,
    };
    updateLocal((prev) => ({
      ...prev,
      locale: currentSettings.locale,
      tab: currentSettings.defaultTab,
      filters: currentSettings.filters,
    }));
    try {
      const { data } = await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(currentSettings),
      });
      updateLocal((prev) => ({
        ...prev,
        locale: data.locale,
        tab: data.defaultTab,
        filters: { ...seed.filters, ...(data.filters || {}) },
      }));
    } catch (error) {
      setSyncError(error.message || 'Could not save settings.');
      await loadResourceState(true);
    }
  }

  async function addExpense(payload) {
    try {
      const { data } = await apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      updateLocal((prev) => ({ ...prev, expenses: [data, ...prev.expenses] }));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not save expense.');
      throw error;
    }
  }

  async function addUdhar(payload) {
    try {
      const { data } = await apiRequest('/api/udhar', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      updateLocal((prev) => ({ ...prev, udhar: [data, ...prev.udhar] }));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not save udhar.');
      throw error;
    }
  }

  async function saveBudget(month, amount) {
    updateLocal((prev) => ({
      ...prev,
      budgets: { ...(prev.budgets || {}), [month]: Number(amount || 0) },
    }));
    try {
      const { data } = await apiRequest(`/api/budgets/${month}`, {
        method: 'PUT',
        body: JSON.stringify({ amount: Number(amount || 0) }),
      });
      updateLocal((prev) => ({
        ...prev,
        budgets: { ...(prev.budgets || {}), [data.month]: data.amount },
      }));
    } catch (error) {
      setSyncError(error.message || 'Could not save budget.');
      await loadResourceState(true);
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;
    try {
      const { data } = await apiRequest('/api/users');
      setUsers(data || []);
    } catch (error) {
      setSyncError(error.message || 'Could not load users.');
    }
  }

  async function saveUser(payload, id) {
    try {
      const body = { ...payload };
      if (!body.password) delete body.password;
      const { data } = await apiRequest(id ? `/api/users/${id}` : '/api/users', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      setUsers((prev) => (id ? prev.map((item) => (item.id === id ? data : item)) : [data, ...prev]));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not save user.');
      throw error;
    }
  }

  async function deleteUser(id) {
    try {
      await apiRequest(`/api/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setSyncError(error.message || 'Could not delete user.');
    }
  }

  const filteredExpenses = (filter === 'all' ? filteredByDate : filteredByDate.filter((item) => item.category === filter))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  if (auth.status === 'checking') {
    return <AuthShell t={t} message={t('checkingSession')} />;
  }

  if (auth.status === 'guest') {
    return <LoginScreen t={t} error={auth.error} onLogin={login} />;
  }

  if (dataStatus === 'loading') {
    return <AuthShell t={t} message={t('loadingData')} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandIcon"><IndianRupee aria-hidden="true" /></div>
          <div>
            <h1>Kharcha</h1>
            <p>{t('appSubtitle')}</p>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => (
            <button
              className={state.tab === tab ? 'active' : ''}
              key={tab}
              aria-label={t(tab)}
              data-tab={tab}
              onClick={() => {
                if (tab === 'users') loadUsers();
                saveSettings({ defaultTab: tab });
              }}
            >
              <IconSlot icon={navIcons[tab]} />
              {t(tab)}
            </button>
          ))}
        </nav>
        <div className="sidebarCard">
          <span>{t('budgetHealth')}</span>
          <strong>{Math.round(metrics.budgetUsed)}%</strong>
          <div className="tinyTrack">
            <i style={{ width: `${Math.min(metrics.budgetUsed, 100)}%` }} />
          </div>
          <p>{budgetStatus(metrics.budgetUsed, t)}</p>
        </div>
        <button className="language" onClick={() => saveSettings({ locale: state.locale === 'hi' ? 'en' : 'hi' })}>
          {state.locale === 'hi' ? 'EN' : 'हिंदी'}
        </button>
        <button className="logoutBtn" onClick={logout}>{t('logout')}</button>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="kicker">Kharcha</p>
            <h2>{state.tab === 'reports' ? t('reportTitle') : t(state.tab)}</h2>
            {state.tab === 'reports' && <p className="subhead">{t('reportSub')}</p>}
          </div>
          <div className="actions">
            <button className="softBtn iconBtn" onClick={() => setUdharOpen(true)}><HandCoins aria-hidden="true" />{t('addUdhar')}</button>
            <button className="primaryBtn iconBtn" onClick={() => setExpenseOpen(true)}><Plus aria-hidden="true" />{t('addExpense')}</button>
          </div>
        </header>

        {syncError && <div className="syncBanner">{syncError}</div>}

        {state.tab !== 'udhar' && state.tab !== 'users' && (
          <DateFilter filters={state.filters} months={availableMonths} t={t} onChange={(filters) => saveSettings({ filters })} />
        )}

        {state.tab === 'dashboard' && (
          <Dashboard
            state={{ ...state, expenses: filteredByDate }}
            metrics={metrics}
            reportData={reportData}
            t={t}
            label={label}
            setTab={(tab) => saveSettings({ defaultTab: tab })}
          />
        )}
        {state.tab === 'expenses' && (
          <Expenses
            expenses={filteredExpenses}
            filter={filter}
            setFilter={setFilter}
            t={t}
            label={label}
            locale={state.locale}
          />
        )}
        {state.tab === 'budget' && (
          <Budget state={state} onSaveBudget={saveBudget} metrics={metrics} reportData={reportData} month={activeBudgetMonth} t={t} locale={state.locale} />
        )}
        {state.tab === 'reports' && (
          <Reports reportData={reportData} metrics={metrics} t={t} locale={state.locale} />
        )}
        {state.tab === 'udhar' && (
          <Udhar balances={metrics.udharBalances} t={t} locale={state.locale} />
        )}
        {state.tab === 'users' && isAdmin && (
          <UsersAdmin
            users={users}
            currentUser={auth.user}
            t={t}
            onAdd={() => {
              setEditingUser(null);
              setUserOpen(true);
            }}
            onEdit={(user) => {
              setEditingUser(user);
              setUserOpen(true);
            }}
            onDelete={deleteUser}
          />
        )}
      </main>

      {expenseOpen && (
        <ExpenseModal t={t} label={label} onClose={() => setExpenseOpen(false)} onSave={addExpense} onUdhar={addUdhar} />
      )}
      {udharOpen && <UdharModal t={t} balances={metrics.udharBalances} locale={state.locale} onClose={() => setUdharOpen(false)} onSave={addUdhar} />}
      {userOpen && <UserModal t={t} user={editingUser} onClose={() => setUserOpen(false)} onSave={saveUser} />}
    </div>
  );
}

function Dashboard({ state, metrics, reportData, t, label, locale, setTab }) {
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
          <PanelHeader title={t('monthlyPulse')} action={t('reports')} onClick={() => setTab('reports')} />
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
          <PanelHeader title={t('recentExpenses')} action={t('expenses')} onClick={() => setTab('expenses')} />
          <List>
            {state.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((item) => (
              <ExpenseRow key={item.id} item={item} label={label} locale={state.locale} />
            ))}
          </List>
        </section>
      </div>
      <section className="panel">
        <PanelHeader title={t('udharPeople')} action={t('udhar')} onClick={() => setTab('udhar')} />
        <div className="peopleGrid">
          {metrics.udharBalances.map((item) => <PersonCard item={item} t={t} locale={state.locale} key={item.person} />)}
        </div>
      </section>
    </div>
  );
}

function DateFilter({ filters, months, t, onChange }) {
  const setPreset = (preset) => {
    if (preset === 'month') {
      const month = filters.month || todayIso.slice(0, 7);
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

  const setMonth = (month) => onChange({ ...filters, preset: 'month', month, from: `${month}-01`, to: monthEnd(month) });

  return (
    <section className="filterBar" aria-label={t('filter')}>
      <div className="segmented">
        {[
          ['month', t('thisMonth')],
          ['last30', t('last30')],
          ['all', t('allTime')],
          ['custom', t('custom')],
        ].map(([value, label]) => (
          <button key={value} className={filters.preset === value ? 'selected' : ''} onClick={() => setPreset(value)}>
            {label}
          </button>
        ))}
      </div>
      <label>
        <span>{t('month')}</span>
        <select value={filters.month || months[0] || todayIso.slice(0, 7)} onChange={(event) => setMonth(event.target.value)}>
          {months.map((month) => <option key={month} value={month}>{formatMonthOption(month)}</option>)}
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

function Reports({ reportData, metrics, t, locale }) {
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
                <Pie
                  data={reportData.category}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={74}
                  outerRadius={112}
                  paddingAngle={2}
                  cornerRadius={8}
                >
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
            <RadialBarChart innerRadius="68%" outerRadius="100%" data={[{ name: 'used', value: Math.min(metrics.budgetUsed, 100), fill: metrics.budgetUsed > 100 ? palette.error : metrics.budgetUsed > 80 ? palette.warning : palette.success }]} startAngle={90} endAngle={-270}>
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

function Expenses({ expenses, filter, setFilter, t, label, locale }) {
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
          {categories.map((item) => <option value={item.key} key={item.key}>{label(item.key)}</option>)}
        </select>
        <button className="softBtn iconBtn" onClick={exportCsv}><Download aria-hidden="true" />{t('exportCsv')}</button>
      </div>
      <List>
        {expenses.map((item) => <ExpenseRow key={item.id} item={item} label={label} locale={locale} />)}
      </List>
    </section>
  );
}

function Budget({ state, onSaveBudget, metrics, reportData, month, t, locale }) {
  const currentBudget = getMonthlyBudget(state, month);
  const [budget, setBudget] = useState(currentBudget);
  const categoryPressure = reportData.category.slice(0, 8).map((item) => ({
    ...item,
    budgetShare: metrics.budget ? Math.round((item.amount / metrics.budget) * 100) : 0,
  }));

  useEffect(() => {
    setBudget(currentBudget);
  }, [currentBudget]);

  const handleSaveBudget = () => {
    onSaveBudget(month, budget);
  };

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
          <button className="primaryBtn iconBtn" onClick={handleSaveBudget}><Save aria-hidden="true" />{t('saveBudget')}</button>
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
            <RadialBarChart innerRadius="68%" outerRadius="100%" data={[{ name: 'used', value: Math.min(metrics.budgetUsed, 100), fill: metrics.budgetUsed > 100 ? palette.error : metrics.budgetUsed > 80 ? palette.warning : palette.success }]} startAngle={90} endAngle={-270}>
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
                <div className="tinyTrack"><i style={{ width: `${Math.min(item.budgetShare, 100)}%`, background: categoryColors[index % categoryColors.length] }} /></div>
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

function Udhar({ balances, t, locale }) {
  return (
    <section className="panel">
      <PanelHeader title={t('udharPeople')} />
      <List>
        {balances.map((item) => <UdharRow item={item} t={t} locale={locale} key={item.person} />)}
      </List>
    </section>
  );
}

function UsersAdmin({ users, currentUser, t, onAdd, onEdit, onDelete }) {
  return (
    <div className="stack">
      <section className="panel">
        <PanelHeader title={t('userManagement')} action={t('addUser')} onClick={onAdd} />
        <p className="panelSub">{t('userManagementSub')}</p>
        <List>
          {users.map((user) => (
            <article className="dataRow userRow" key={user.id}>
              <div className={user.role === 'admin' ? 'avatar receive' : 'avatar'}>
                <UsersRound aria-hidden="true" />
              </div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email} · {user.role === 'admin' ? t('admin') : t('user')}</span>
                <span>{t('lastLogin')}: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : t('noData')}</span>
              </div>
              <div className="rowActions">
                <button className="softBtn" onClick={() => onEdit(user)}>{t('editUser')}</button>
                <button className="dangerBtn" disabled={user.id === currentUser?.id} onClick={() => onDelete(user.id)}>{t('deleteUser')}</button>
              </div>
            </article>
          ))}
        </List>
      </section>
    </div>
  );
}

function ExpenseModal({ t, label, onClose, onSave, onUdhar }) {
  const [linkUdhar, setLinkUdhar] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      amount: Number(data.get('amount')),
      category: data.get('category'),
      note: data.get('note'),
      mode: data.get('mode'),
      date: data.get('date'),
    };
    await onSave(payload);
    if (linkUdhar && data.get('person')) {
      await onUdhar({ person: data.get('person'), phone: '', direction: 'given', amount: payload.amount, note: payload.note, date: payload.date });
    }
    onClose();
  }

  return (
    <Modal title={t('addExpense')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('amount')}><input name="amount" required type="number" min="1" placeholder="500" /></Field>
        <Field label={t('category')}><select name="category">{categories.map((item) => <option key={item.key} value={item.key}>{label(item.key)}</option>)}</select></Field>
        <Field label={t('note')}><input name="note" required placeholder="Lunch, kirana, rent..." /></Field>
        <div className="formGrid">
          <Field label={t('payment')}><select name="mode"><option>UPI</option><option>Cash</option><option>Card</option></select></Field>
          <Field label={t('date')}><input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={linkUdhar} onChange={(e) => setLinkUdhar(e.target.checked)} /> Add as Diya in Udhar</label>
        {linkUdhar && <Field label={t('person')}><input name="person" placeholder="Rahul" /></Field>}
        <button className="primaryBtn full iconBtn"><Save aria-hidden="true" />{t('save')}</button>
      </form>
    </Modal>
  );
}

function UdharModal({ t, balances, locale, onClose, onSave }) {
  const [person, setPerson] = useState('');
  const [direction, setDirection] = useState('given');
  const [dueDate, setDueDate] = useState('');
  const [interestRate, setInterestRate] = useState(0);
  const [amount, setAmount] = useState('');
  const selectedBalance = balances.find((item) => item.person.toLowerCase() === person.trim().toLowerCase());
  const isSettlement = direction === 'settle_taken' || direction === 'settle_given';
  const closing = selectedBalance ? calculateClosing(selectedBalance.balance, dueDate || selectedBalance.dueDate, Number(interestRate || 0)) : null;

  const handlePersonChange = (value) => {
    setPerson(value);
    const match = balances.find((item) => item.person.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setDueDate(match.dueDate || '');
      setInterestRate(match.interestRate || 0);
      if (direction === 'settle_taken' || direction === 'settle_given') {
        setAmount(String(Math.ceil(match.closing.total)));
      }
    }
  };

  const handleDirectionChange = (value) => {
    setDirection(value);
    if ((value === 'settle_taken' || value === 'settle_given') && selectedBalance) {
      setAmount(String(Math.ceil(calculateClosing(selectedBalance.balance, dueDate || selectedBalance.dueDate, Number(interestRate || 0)).total)));
    }
  };

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onSave({
      person,
      phone: data.get('phone'),
      direction,
      amount: Number(amount),
      note: data.get('note'),
      date: data.get('date'),
      dueDate,
      interestRate: Number(interestRate || 0),
    });
    onClose();
  }

  return (
    <Modal title={t('addUdhar')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('person')}>
          <input name="person" required placeholder={t('savedContactHint')} value={person} onChange={(event) => handlePersonChange(event.target.value)} />
        </Field>
        <Field label={t('phone')}><input name="phone" inputMode="tel" placeholder="9876543210" /></Field>
        <div className="directionGrid">
          {[
            ['given', t('diya')],
            ['taken', t('liya')],
            ['settle_taken', t('theyPaid')],
            ['settle_given', t('youPaid')],
          ].map(([value, label], index) => (
            <label key={value}>
              <input
                type="radio"
                name="direction"
                value={value}
                checked={direction === value}
                onChange={() => handleDirectionChange(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="formGrid">
          <Field label={t('dueDate')}><input name="dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
          <Field label={t('interestRate')}><input name="interestRate" type="number" min="0" step="0.1" value={interestRate} onChange={(event) => setInterestRate(event.target.value)} /></Field>
        </div>
        {isSettlement && selectedBalance && (
          <div className="closingBox">
            <div><span>{t('principal')}</span><strong>{formatInr(closing.principal, locale)}</strong></div>
            <div><span>{t('interest')}</span><strong>{formatInr(closing.interest, locale)}</strong></div>
            <div><span>{closing.daysOverdue > 0 ? `${closing.daysOverdue} ${t('daysLate')}` : t('noInterest')}</span><strong>{formatInr(closing.total, locale)}</strong></div>
            <p>{t('closingAmount')}</p>
          </div>
        )}
        <div className="formGrid">
          <Field label={t('amount')}>
            <input
              name="amount"
              required
              type="number"
              min="1"
              placeholder={closing ? String(Math.ceil(closing.total)) : '500'}
              value={isSettlement && closing ? String(Math.ceil(closing.total)) : amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label={t('date')}><input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
        </div>
        <Field label={t('note')}><input name="note" placeholder="Trip, repayment..." /></Field>
        <button className="primaryBtn full iconBtn"><Save aria-hidden="true" />{t('save')}</button>
      </form>
    </Modal>
  );
}

function UserModal({ t, user, onClose, onSave }) {
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await onSave({
      name: data.get('name'),
      email: data.get('email'),
      role: data.get('role'),
      password: data.get('password'),
    }, user?.id);
    onClose();
  }

  return (
    <Modal title={user ? t('editUser') : t('addUser')} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label={t('name')}><input name="name" required defaultValue={user?.name || ''} /></Field>
        <Field label={t('email')}><input name="email" type="email" required defaultValue={user?.email || ''} /></Field>
        <Field label={t('role')}>
          <select name="role" defaultValue={user?.role === 'admin' ? 'admin' : 'user'}>
            <option value="user">{t('user')}</option>
            <option value="admin">{t('admin')}</option>
          </select>
        </Field>
        <Field label={user ? t('newPassword') : t('password')}>
          <input name="password" type="password" required={!user} minLength="8" placeholder={user ? t('leaveBlankPassword') : 'ChangeMe123!'} />
        </Field>
        <button className="primaryBtn full iconBtn"><Save aria-hidden="true" />{t('save')}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modalBackdrop" role="presentation">
      <div className="modal modalCard" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalHead"><h3>{title}</h3><button onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button></div>
        {children}
      </div>
    </div>
  );
}

function AuthShell({ t, message }) {
  return (
    <div className="authPage">
      <div className="authCard">
        <div className="brand authBrand">
          <div className="brandIcon"><IndianRupee aria-hidden="true" /></div>
          <div>
            <h1>Kharcha</h1>
            <p>{t('appSubtitle')}</p>
          </div>
        </div>
        <p className="authMuted">{message}</p>
      </div>
    </div>
  );
}

function LoginScreen({ t, error, onLogin }) {
  const [email, setEmail] = useState('owner@kharcha.local');
  const [password, setPassword] = useState('');

  function submit(event) {
    event.preventDefault();
    onLogin({ email, password });
  }

  return (
    <div className="authPage">
      <form className="authCard" onSubmit={submit}>
        <div className="brand authBrand">
          <div className="brandIcon"><IndianRupee aria-hidden="true" /></div>
          <div>
            <h1>Kharcha</h1>
            <p>{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="authIntro">
          <h2>{t('loginTitle')}</h2>
          <p>{t('loginSub')}</p>
        </div>
        <Field label={t('email')}>
          <input type="email" value={email} autoComplete="username" required onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label={t('password')}>
          <input type="password" value={password} autoComplete="current-password" required minLength={8} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        {error && <p className="authError">{error}</p>}
        <button className="primaryBtn full iconBtn"><IndianRupee aria-hidden="true" />{t('login')}</button>
      </form>
    </div>
  );
}

function Metric({ title, value, tone }) {
  return <article className={`metric ${tone}`}><span>{title}</span><strong>{value}</strong></article>;
}

function PanelHeader({ title, action, onClick }) {
  return <div className="panelHead"><h3>{title}</h3>{action && <button onClick={onClick}>{action}</button>}</div>;
}

function List({ children }) {
  return <div className="list">{children}</div>;
}

function ExpenseRow({ item, label, locale }) {
  const CategoryIcon = categoryIcons[item.category] || Landmark;
  return (
    <article className="dataRow">
      <div className="avatar"><CategoryIcon aria-hidden="true" /></div>
      <div><strong>{item.note}</strong><span>{label(item.category)} · {item.mode} · {item.date}</span></div>
      <b className="negative">-{formatInr(item.amount, locale)}</b>
    </article>
  );
}

function PersonCard({ item, t, locale }) {
  return (
    <article className={item.isOverdue ? 'personCard overdueCard' : 'personCard'}>
      <span>{item.person}</span>
      <strong className={item.balance >= 0 ? 'positive' : 'negative'}>{signedInr(item.balance, locale)}</strong>
      {item.isOverdue && <em>{t('overdue')} · {formatInr(item.closing.interest, locale)} {t('interest')}</em>}
    </article>
  );
}

function UdharRow({ item, locale, t }) {
  const DirectionIcon = item.balance >= 0 ? ArrowDownLeft : ArrowUpRight;
  return (
    <article className="dataRow">
      <div className={item.balance >= 0 ? 'avatar receive' : 'avatar owe'}><DirectionIcon aria-hidden="true" /></div>
      <div>
        <strong>{item.person} {item.isOverdue && <small className="badge overdueBadge">{t('overdue')}</small>}</strong>
        <span>
          {item.entries.length} {t('entries')}
          {item.dueDate ? ` · ${t('due')} ${item.dueDate}` : ''}
          {item.interestRate ? ` · ${item.interestRate}% p.a.` : ''}
        </span>
        <span>{t('close')}: {formatInr(item.closing.total, locale)} ({formatInr(item.closing.principal, locale)} + {formatInr(item.closing.interest, locale)})</span>
      </div>
      <b className={item.balance >= 0 ? 'positive' : 'negative'}>{signedInr(item.balance, locale)}</b>
    </article>
  );
}
