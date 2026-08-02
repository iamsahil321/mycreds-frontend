import { categories } from '../data/categories.js';
import { seed, todayIso } from '../data/seed.js';
import { entryValue } from './format.js';

export function template(text, values) {
  return Object.entries(values).reduce((result, [key, value]) => result.replace(`{${key}}`, value), text);
}

export function computeMetrics(state, scopedExpenses = state.expenses, month = getActiveBudgetMonth(state.filters)) {
  const spent = scopedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const budget = getMonthlyBudget(state, month);
  const budgetLeft = budget - spent;
  const byPerson = new Map();
  state.udhar.forEach((entry) => {
    const current = byPerson.get(entry.person) || { person: entry.person, phone: entry.phone, balance: 0, entries: [] };
    current.balance += entryValue(entry);
    current.entries.push(entry);
    if (entry.phone) current.phone = entry.phone;
    byPerson.set(entry.person, current);
  });
  const udharBalances = Array.from(byPerson.values()).map(enrichUdharBalance).sort((a, b) => Math.abs(b.closing.total) - Math.abs(a.closing.total));
  const receivable = udharBalances.reduce((sum, item) => sum + Math.max(item.balance, 0), 0);
  const payable = udharBalances.reduce((sum, item) => sum + Math.abs(Math.min(item.balance, 0)), 0);
  return { spent, budget, budgetLeft, budgetUsed: budget ? (spent / budget) * 100 : 0, udharBalances, receivable, payable, net: receivable - payable };
}

function enrichUdharBalance(person) {
  const latestPrincipal = [...person.entries]
    .filter((entry) => entry.direction === 'given' || entry.direction === 'taken')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const dueDate = latestPrincipal?.dueDate || '';
  const interestRate = Number(latestPrincipal?.interestRate || 0);
  const closing = calculateClosing(person.balance, dueDate, interestRate);
  return {
    ...person,
    dueDate,
    interestRate,
    daysOverdue: closing.daysOverdue,
    isOverdue: closing.daysOverdue > 0,
    closing,
  };
}

export function calculateClosing(balance, dueDate, interestRate) {
  const daysOverdue = dueDate && balance !== 0 ? Math.max(0, daysBetween(dueDate, todayIso)) : 0;
  const principal = Math.abs(balance);
  const interest = Math.round(principal * (Number(interestRate || 0) / 100) * (daysOverdue / 365));
  return { principal, interest, total: principal + interest, daysOverdue };
}

export function filterExpensesByDate(expenses, filters = seed.filters) {
  if (filters.preset === 'all') return expenses;
  const selectedMonth = filters.month || todayIso.slice(0, 7);
  const from = filters.preset === 'month' ? `${selectedMonth}-01` : filters.from;
  const to = filters.preset === 'month' ? monthEnd(selectedMonth) : filters.to;
  return expenses.filter((item) => (!from || item.date >= from) && (!to || item.date <= to));
}

export function normalizeDateFilters(filters = seed.filters, expenses = []) {
  const currentMonth = todayIso.slice(0, 7);
  if (filters.preset !== 'month') return { ...seed.filters, ...filters };

  const availableMonths = getExpenseMonths(expenses);
  const month = availableMonths.includes(filters.month) ? filters.month : currentMonth;
  return {
    ...seed.filters,
    ...filters,
    preset: 'month',
    month,
    from: `${month}-01`,
    to: monthEnd(month),
  };
}

export function getActiveBudgetMonth(filters = seed.filters) {
  if (filters.preset === 'month' && filters.month) return filters.month;
  if (filters.to) return filters.to.slice(0, 7);
  return todayIso.slice(0, 7);
}

export function getMonthlyBudget(state, month) {
  return Number(state.budgets?.[month] ?? state.budget ?? seed.budget);
}

export function getExpenseMonths(expenses) {
  return [...new Set(expenses.map((item) => item.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
}

export function formatMonthOption(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function monthEnd(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber, 0).toISOString().slice(0, 10);
}

export function addDays(dateIso, days) {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromIso, toIso) {
  const start = new Date(`${fromIso}T00:00:00`);
  const end = new Date(`${toIso}T00:00:00`);
  return Math.floor((end - start) / 86400000);
}

export function buildReports(state, label, allExpenses = state.expenses, filters = seed.filters) {
  const spent = state.expenses.reduce((sum, item) => sum + item.amount, 0) || 1;
  const category = categories
    .map((category) => ({ name: label(category.key), amount: state.expenses.filter((item) => item.category === category.key).reduce((sum, item) => sum + item.amount, 0) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({ ...item, share: Math.round((item.amount / spent) * 100) }));
  const trend = buildMonthlyTrend(allExpenses, filters.month || todayIso.slice(0, 7));
  const average = Math.round(trend.reduce((sum, item) => sum + item.spent, 0) / Math.max(trend.length, 1));
  const trendWithAverage = trend.map((item) => ({ ...item, average }));
  const payment = ['UPI', 'Cash', 'Card'].map((mode) => ({
    mode,
    amount: state.expenses.filter((item) => item.mode === mode).reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.amount > 0);
  return { category, trend: trendWithAverage, payment };
}

function buildMonthlyTrend(expenses, selectedMonth) {
  const [year, month] = selectedMonth.split('-').map(Number);
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - 1 - (5 - index), 1);
    const key = date.toISOString().slice(0, 7);
    const monthLabel = date.toLocaleDateString('en-IN', { month: 'short' });
    const spent = expenses.filter((item) => item.date.startsWith(key)).reduce((sum, item) => sum + item.amount, 0);
    return { month: monthLabel, monthKey: key, spent };
  });
}

export function budgetStatus(used, t) {
  if (used >= 100) return t('crossed');
  if (used >= 80) return t('watch');
  return t('onTrack');
}
