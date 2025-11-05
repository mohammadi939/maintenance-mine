import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './lib/theme.js';
import { EventProvider } from './lib/events.js';
import { RouterProvider } from './lib/router.js';
import { ToastProvider } from './lib/toast.js';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <RouterProvider>
      <ThemeProvider>
        <ToastProvider>
          <EventProvider>
            <App />
          </EventProvider>
        </ToastProvider>
      </ThemeProvider>
    </RouterProvider>
  </React.StrictMode>
);
