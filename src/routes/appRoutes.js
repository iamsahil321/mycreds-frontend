export const defaultRoute = 'dashboard';

export const publicRoutes = {
  login: '/login',
};

export const protectedRoutes = {
  dashboard: '/dashboard',
  expenses: '/expenses',
  budget: '/budget',
  reports: '/reports',
  udhar: '/udhar',
  users: '/users',
};

export function routeFromPath(pathname = window.location.pathname) {
  if (pathname === protectedRoutes.udhar || pathname.startsWith(`${protectedRoutes.udhar}/`)) {
    return 'udhar';
  }
  const match = Object.entries(protectedRoutes).find(([, path]) => path === pathname);
  return match?.[0] || defaultRoute;
}

export function pathForRoute(route) {
  return protectedRoutes[route] || protectedRoutes[defaultRoute];
}

export function isProtectedRoute(route) {
  return Boolean(protectedRoutes[route]);
}

export function udharAccountPath(accountId) {
  return `${protectedRoutes.udhar}/${accountId}`;
}

export function udharAccountIdFromPath(pathname = window.location.pathname) {
  const prefix = `${protectedRoutes.udhar}/`;
  if (!pathname.startsWith(prefix)) return '';
  return decodeURIComponent(pathname.slice(prefix.length));
}
