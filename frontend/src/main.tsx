import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from './i18n';
import { AuthProvider } from './auth/AuthContext';
import './styles/tokens.css';
import './styles/base.css';
import { initTheme } from './utils/theme';

initTheme();

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 15000 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <LangProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
