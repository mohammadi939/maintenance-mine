import { useEffect, useMemo } from 'react';
import Layout from './components/Layout.jsx';
import { useTheme } from './lib/theme.js';
import { useRouter } from './lib/router.js';
import { appRoutes } from './routes.jsx';

function App() {
  const { theme } = useTheme();
  const { path, navigate } = useRouter();

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (path === '/') {
      navigate('/timeline');
    }
  }, [path, navigate]);

  const ActiveComponent = useMemo(() => {
    if (path === '/') return null;
    const exactMatch = appRoutes.find((route) => route.path === path);
    if (exactMatch) return exactMatch.component;
    const notFound = appRoutes.find((route) => route.path === '*');
    return notFound ? notFound.component : null;
  }, [path]);

  return <Layout>{ActiveComponent ? <ActiveComponent /> : null}</Layout>;
}

export default App;
