import { useEffect, useState } from 'react';
import { defaultRoute, pathForRoute, routeFromPath } from '../routes/appRoutes.js';

export function useAppRoute(isAdmin) {
  const [path, setPath] = useState(() => window.location.pathname);
  const route = routeFromPath(path);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isAdmin && route !== 'users') {
      navigate('users', { replace: true });
      return;
    }
    if (route === 'users' && !isAdmin) {
      navigate(defaultRoute, { replace: true });
    }
  }, [route, isAdmin]);

  function navigate(nextRoute, options = {}) {
    const allowedRoute = isAdmin ? 'users' : nextRoute === 'users' ? defaultRoute : nextRoute;
    const nextPath = pathForRoute(allowedRoute);
    if (path !== nextPath) {
      const method = options.replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', nextPath);
    }
    setPath(nextPath);
  }

  function navigatePath(nextPath, options = {}) {
    const method = options.replace ? 'replaceState' : 'pushState';
    if (path !== nextPath) window.history[method]({}, '', nextPath);
    setPath(nextPath);
  }

  return { route, path, navigate, navigatePath };
}
