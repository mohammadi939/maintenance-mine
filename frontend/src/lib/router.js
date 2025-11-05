import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext();

const normalizePath = (hash) => {
  const cleaned = hash.replace(/^#/, '');
  return cleaned || '/';
};

export function RouterProvider({ children, defaultPath = '/timeline' }) {
  const [path, setPath] = useState(() => normalizePath(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setPath(normalizePath(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (path === '/' && defaultPath) {
      window.location.hash = defaultPath;
    }
  }, [path, defaultPath]);

  const navigate = (nextPath) => {
    if (!nextPath) return;
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    if (normalized === path) return;
    window.location.hash = normalized;
    setPath(normalized);
  };

  const value = useMemo(() => ({ path, navigate }), [path]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter باید داخل RouterProvider استفاده شود');
  return context;
}

export function Link({ to, children, className, ...rest }) {
  const { navigate } = useRouter();
  const handleClick = (event) => {
    event.preventDefault();
    navigate(to);
  };
  const href = `#${to}`;
  return (
    <a href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
