export function getTodayIso(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const todayIso = getTodayIso();
const currentMonth = todayIso.slice(0, 7);

export const seed = {
  locale: 'en',
  tab: 'dashboard',
  budget: 0,
  budgets: {},
  filters: { preset: 'month', month: currentMonth, from: `${currentMonth}-01`, to: '' },
  expenses: [],
  udhar: [],
};
