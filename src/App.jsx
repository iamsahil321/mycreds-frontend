import { useEffect, useMemo, useState } from 'react';
import { DateFilter } from './components/filters/DateFilter.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { categories } from './data/categories.js';
import { dictionary } from './data/i18n.js';
import { seed } from './data/seed.js';
import { useAppRoute } from './hooks/useAppRoute.js';
import { buildReports, computeMetrics, filterExpensesByDate, getActiveBudgetMonth, getExpenseMonths } from './lib/money.jsx';
import { ConfirmDeleteModal, ExpenseModal, UdharModal, UserModal } from './modals/index.js';
import { AuthShell } from './pages/auth/AuthShell.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { BudgetPage, DashboardPage, ExpensesPage, ReportsPage, UdharPage, UsersAdminPage } from './pages/index.js';
import { getSession, loginUser, logoutUser, request } from './services/httpClient.js';

export default function App() {
  const [state, setState] = useState(seed);
  const [auth, setAuth] = useState({ status: 'checking', user: null, error: '' });
  const [dataStatus, setDataStatus] = useState('idle');
  const [syncError, setSyncError] = useState('');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [udharOpen, setUdharOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingUdhar, setEditingUdhar] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [users, setUsers] = useState([]);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  const t = (key) => dictionary[state.locale][key] || key;
  const isAdmin = auth.user?.role === 'admin' || auth.user?.role === 'owner';
  const { route, navigate } = useAppRoute(isAdmin);
  const activeRoute = isAdmin ? 'users' : route;
  const label = (key) => categories.find((item) => item.key === key)?.[state.locale] || key;
  const availableMonths = useMemo(() => getExpenseMonths(state.expenses), [state.expenses]);
  const activeBudgetMonth = getActiveBudgetMonth(state.filters);
  const filteredByDate = useMemo(() => filterExpensesByDate(state.expenses, state.filters), [state.expenses, state.filters]);
  const metrics = useMemo(() => computeMetrics(state, filteredByDate, activeBudgetMonth), [state, filteredByDate, activeBudgetMonth]);
  const reportData = useMemo(
    () => buildReports({ ...state, expenses: filteredByDate }, label, state.expenses, state.filters),
    [state, filteredByDate, state.locale]
  );
  const filteredExpenses = useMemo(
    () =>
      (expenseCategoryFilter === 'all' ? filteredByDate : filteredByDate.filter((item) => item.category === expenseCategoryFilter))
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenseCategoryFilter, filteredByDate]
  );

  useEffect(() => {
    let mounted = true;
    getSession()
      .then(async (session) => {
        if (!mounted) return;
        if (!session?.user) {
          setAuth({ status: 'guest', user: null, error: '' });
          return;
        }
        setAuth({ status: 'authenticated', user: session.user, error: '' });
        await loadResourceState(mounted, session.user);
      })
      .catch(() => {
        if (mounted) setAuth({ status: 'guest', user: null, error: '' });
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (route === 'users' && isAdmin) loadUsers();
  }, [route, isAdmin]);

  async function loadResourceState(mounted = true, user = auth.user) {
    if (!mounted) return;
    setDataStatus('loading');
    setSyncError('');
    try {
      const [settingsData, budgetsData, expensesData, udharData] = await Promise.all([
        request('/api/settings'),
        request('/api/budgets'),
        request('/api/expenses?limit=2000'),
        request('/api/udhar?limit=2000'),
      ]);
      if (!mounted) return;
      const settings = settingsData.data || {};
      const canUseAdminTab = user?.role === 'admin' || user?.role === 'owner';
      const budgets = Object.fromEntries((budgetsData.data || []).map((item) => [item.month, item.amount]));
      setState({
        ...seed,
        locale: settings.locale || seed.locale,
        filters: { ...seed.filters, ...(settings.filters || {}) },
        budgets,
        expenses: expensesData.data || [],
        udhar: udharData.data || [],
      });
      if (canUseAdminTab) {
        navigate('users', { replace: true });
        await loadUsers();
      } else if (settings.defaultTab && settings.defaultTab !== route) {
        navigate(settings.defaultTab === 'users' ? 'dashboard' : settings.defaultTab, { replace: true });
      }
      setDataStatus('ready');
    } catch (error) {
      if (!mounted) return;
      setDataStatus('error');
      setSyncError(error.message || 'Could not load app data.');
    }
  }

  async function login(credentials) {
    setAuth((prev) => ({ ...prev, status: 'checking', error: '' }));
    try {
      const data = await loginUser(credentials);
      setAuth({ status: 'authenticated', user: data.user, error: '' });
      await loadResourceState(true, data.user);
    } catch (error) {
      setAuth({ status: 'guest', user: null, error: error.message || 'Login failed' });
    }
  }

  async function logout() {
    await logoutUser();
    setAuth({ status: 'guest', user: null, error: '' });
    setDataStatus('idle');
    setState(seed);
  }

  async function saveSettings(patch) {
    if (isAdmin) patch.defaultTab = 'users';
    if (patch.defaultTab === 'users' && !isAdmin) patch.defaultTab = 'dashboard';
    const currentSettings = {
      locale: state.locale,
      defaultTab: activeRoute,
      filters: state.filters,
      ...patch,
    };
    setState((prev) => ({ ...prev, locale: currentSettings.locale, filters: currentSettings.filters }));
    try {
      const { data } = await request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(currentSettings),
      });
      setState((prev) => ({ ...prev, locale: data.locale, filters: { ...seed.filters, ...(data.filters || {}) } }));
    } catch (error) {
      setSyncError(error.message || 'Could not save settings.');
      await loadResourceState(true);
    }
  }

  function changeRoute(nextRoute) {
    if (isAdmin) {
      loadUsers();
      navigate('users');
      saveSettings({ defaultTab: 'users' });
      return;
    }
    if (nextRoute === 'users') loadUsers();
    navigate(nextRoute);
    saveSettings({ defaultTab: nextRoute });
  }

  async function addExpense(payload) {
    try {
      const { data } = await request('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });
      setState((prev) => ({ ...prev, expenses: [data, ...prev.expenses] }));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not save expense.');
      throw error;
    }
  }

  async function saveExpense(payload) {
    if (!editingExpense) return addExpense(payload);
    try {
      const { data } = await request(`/api/expenses/${editingExpense.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setState((prev) => ({ ...prev, expenses: prev.expenses.map((item) => (item.id === data.id ? data : item)) }));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not update expense.');
      throw error;
    }
  }

  async function addUdhar(payload) {
    try {
      const { data } = await request('/api/udhar', { method: 'POST', body: JSON.stringify(payload) });
      setState((prev) => ({ ...prev, udhar: [data, ...prev.udhar] }));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not save udhar.');
      throw error;
    }
  }

  async function saveUdhar(payload) {
    if (!editingUdhar) return addUdhar(payload);
    try {
      const { data } = await request(`/api/udhar/${editingUdhar.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setState((prev) => ({ ...prev, udhar: prev.udhar.map((item) => (item.id === data.id ? data : item)) }));
      return data;
    } catch (error) {
      setSyncError(error.message || 'Could not update udhar.');
      throw error;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'expense') {
        await request(`/api/expenses/${deleteTarget.item.id}`, { method: 'DELETE' });
        setState((prev) => ({ ...prev, expenses: prev.expenses.filter((item) => item.id !== deleteTarget.item.id) }));
      }
      if (deleteTarget.type === 'udhar') {
        await request(`/api/udhar/${deleteTarget.item.id}`, { method: 'DELETE' });
        setState((prev) => ({ ...prev, udhar: prev.udhar.filter((item) => item.id !== deleteTarget.item.id) }));
      }
      setDeleteTarget(null);
    } catch (error) {
      setSyncError(error.message || 'Could not delete item.');
    }
  }

  async function saveBudget(month, amount) {
    setState((prev) => ({ ...prev, budgets: { ...(prev.budgets || {}), [month]: Number(amount || 0) } }));
    try {
      const { data } = await request(`/api/budgets/${month}`, { method: 'PUT', body: JSON.stringify({ amount: Number(amount || 0) }) });
      setState((prev) => ({ ...prev, budgets: { ...(prev.budgets || {}), [data.month]: data.amount } }));
    } catch (error) {
      setSyncError(error.message || 'Could not save budget.');
      await loadResourceState(true);
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;
    try {
      const { data } = await request('/api/users');
      setUsers(data || []);
    } catch (error) {
      setSyncError(error.message || 'Could not load users.');
    }
  }

  async function saveUser(payload, id) {
    try {
      const body = { ...payload };
      if (!body.password) delete body.password;
      const { data } = await request(id ? `/api/users/${id}` : '/api/users', {
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
      await request(`/api/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setSyncError(error.message || 'Could not delete user.');
    }
  }

  if (auth.status === 'checking') return <AuthShell t={t} message={t('checkingSession')} />;
  if (auth.status === 'guest') return <LoginPage t={t} error={auth.error} onLogin={login} />;
  if (dataStatus === 'loading') return <AuthShell t={t} message={t('loadingData')} />;

  return (
    <AppShell
      activeRoute={activeRoute}
      isAdmin={isAdmin}
      metrics={metrics}
      syncError={syncError}
      t={t}
      locale={state.locale}
      onAddExpense={() => {
        setEditingExpense(null);
        setExpenseOpen(true);
      }}
      onAddUdhar={() => {
        setEditingUdhar(null);
        setUdharOpen(true);
      }}
      onLogout={logout}
      onRouteChange={changeRoute}
      onToggleLanguage={() => saveSettings({ locale: state.locale === 'hi' ? 'en' : 'hi' })}
    >
      {activeRoute !== 'udhar' && activeRoute !== 'users' && (
        <DateFilter filters={state.filters} months={availableMonths} t={t} onChange={(filters) => saveSettings({ filters })} />
      )}

      {activeRoute === 'dashboard' && (
        <DashboardPage state={{ ...state, expenses: filteredByDate }} metrics={metrics} reportData={reportData} t={t} label={label} onRouteChange={changeRoute} />
      )}
      {activeRoute === 'expenses' && (
        <ExpensesPage
          expenses={filteredExpenses}
          filter={expenseCategoryFilter}
          setFilter={setExpenseCategoryFilter}
          t={t}
          label={label}
          locale={state.locale}
          onEdit={(expense) => {
            setEditingExpense(expense);
            setExpenseOpen(true);
          }}
          onDelete={(expense) => setDeleteTarget({ type: 'expense', item: expense })}
        />
      )}
      {activeRoute === 'budget' && <BudgetPage state={state} onSaveBudget={saveBudget} metrics={metrics} reportData={reportData} month={activeBudgetMonth} t={t} locale={state.locale} />}
      {activeRoute === 'reports' && <ReportsPage reportData={reportData} metrics={metrics} t={t} locale={state.locale} />}
      {activeRoute === 'udhar' && (
        <UdharPage
          balances={metrics.udharBalances}
          t={t}
          locale={state.locale}
          onEdit={(entry) => {
            setEditingUdhar(entry);
            setUdharOpen(true);
          }}
          onDelete={(entry) => setDeleteTarget({ type: 'udhar', item: entry })}
        />
      )}
      {activeRoute === 'users' && isAdmin && (
        <UsersAdminPage
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

      {expenseOpen && (
        <ExpenseModal
          t={t}
          label={label}
          expense={editingExpense}
          onClose={() => {
            setExpenseOpen(false);
            setEditingExpense(null);
          }}
          onSave={saveExpense}
          onUdhar={addUdhar}
        />
      )}
      {udharOpen && (
        <UdharModal
          t={t}
          balances={metrics.udharBalances}
          locale={state.locale}
          entry={editingUdhar}
          onClose={() => {
            setUdharOpen(false);
            setEditingUdhar(null);
          }}
          onSave={saveUdhar}
        />
      )}
      {userOpen && <UserModal t={t} user={editingUser} onClose={() => setUserOpen(false)} onSave={saveUser} />}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={t('confirmDelete')}
          message={deleteTarget.type === 'expense' ? t('confirmDeleteExpense') : t('confirmDeleteUdhar')}
          warning={t('deleteWarning')}
          confirmLabel={deleteTarget.type === 'expense' ? t('deleteExpense') : t('deleteUdhar')}
          cancelLabel={t('cancel')}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </AppShell>
  );
}
