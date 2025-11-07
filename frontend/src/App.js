import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExitFormPage from './pages/ExitFormPage';
import RepairFormPage from './pages/RepairFormPage';
import EntryConfirmPage from './pages/EntryConfirmPage';
import StatusBoardPage from './pages/StatusBoardPage';
import InventoryPage from './pages/InventoryPage';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">در حال بارگذاری...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={(
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        )}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forms/exit" element={<ExitFormPage />} />
        <Route path="/forms/repair" element={<RepairFormPage />} />
        <Route path="/forms/entry" element={<EntryConfirmPage />} />
        <Route path="/board" element={<StatusBoardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
