import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { AppStoreProvider } from './ui/AppStore';
import { ThemeProvider } from './ui/Theme';
import { AuthGate } from './ui/AuthGate';
import { AppLayout } from './ui/AppLayout';
import { Landing } from './ui/screens/Landing';
import { Login } from './ui/screens/Login';
import { Denied } from './ui/screens/Denied';
import { Dashboard } from './ui/screens/Dashboard';
import { CreateStartup } from './ui/screens/CreateStartup';
import { Interview } from './ui/screens/Interview';
import { StartupLayout } from './ui/screens/StartupLayout';
import { SpecWorkspace } from './ui/screens/SpecWorkspace';
import { Trace } from './ui/screens/Trace';
import { Architecture } from './ui/screens/Architecture';
import { History } from './ui/screens/History';
import { Repo } from './ui/screens/Repo';
import { Health } from './ui/screens/Health';
import { Showcase } from './ui/screens/Showcase';
import { Marketplace } from './ui/screens/Marketplace';
import { Leaderboard } from './ui/screens/Leaderboard';
import { Portfolio } from './ui/screens/Portfolio';
import { Admin } from './ui/screens/Admin';
import { PickRepo } from './ui/screens/PickRepo';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppStoreProvider>
        <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/denied" element={<Denied />} />

          {/* onboarding (gated, no app layout) */}
          <Route path="/onboarding/repo" element={<AuthGate><PickRepo /></AuthGate>} />

          {/* gated */}
          <Route element={<AuthGate><AppLayout /></AuthGate>}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/new" element={<CreateStartup />} />
            <Route path="/app/marketplace" element={<Marketplace />} />
            <Route path="/app/leaderboard" element={<Leaderboard />} />
            <Route path="/app/portfolio" element={<Portfolio />} />
            <Route path="/app/startups/:id/interview" element={<Interview />} />
            <Route path="/app/startups/:id" element={<StartupLayout />}>
              <Route index element={<Navigate to="spec" replace />} />
              <Route path="spec" element={<SpecWorkspace />} />
              <Route path="trace" element={<Trace />} />
              <Route path="architecture" element={<Architecture />} />
              <Route path="history" element={<History />} />
              <Route path="repo" element={<Repo />} />
              <Route path="health" element={<Health />} />
              <Route path="showcase" element={<Showcase />} />
            </Route>
          </Route>

          {/* admin */}
          <Route element={<AuthGate adminOnly><AppLayout /></AuthGate>}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AppStoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
