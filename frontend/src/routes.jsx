import EntryFormPage from './pages/EntryFormPage.jsx';
import ExitFormPage from './pages/ExitFormPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import EntryListPage from './pages/EntryListPage.jsx';
import ExitListPage from './pages/ExitListPage.jsx';
import RepairFormPage from './pages/RepairFormPage.jsx';
import RepairListPage from './pages/RepairListPage.jsx';
import TimelinePage from './pages/TimelinePage.jsx';

export const appRoutes = [
  { path: '/timeline', component: TimelinePage },
  { path: '/forms/entry', component: EntryFormPage },
  { path: '/forms/repair', component: RepairFormPage },
  { path: '/forms/exit', component: ExitFormPage },
  { path: '/lists/entries', component: EntryListPage },
  { path: '/lists/repairs', component: RepairListPage },
  { path: '/lists/exits', component: ExitListPage },
  { path: '*', component: NotFoundPage },
];
