import { useEffect, useState } from 'react';
import { defaultRoute, pathForRoute, routeFromPath } from '../routes/appRoutes.js';

export function useAppRoute(isAdmin) {
  const [route, setRoute] = useState(() => routeFromPath());

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath());
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
    if (window.location.pathname !== nextPath) {
      const method = options.replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', nextPath);
    }
    setRoute(allowedRoute);
  }

  return { route, navigate };
}
