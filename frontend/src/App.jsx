import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import Overview from './pages/Overview';
import Simulator from './pages/Simulator';
import CashFlow from './pages/CashFlow';
import Advisor from './pages/Advisor';
import LoanEngine from './pages/LoanEngine';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page as Root */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Overview />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="cash-flow" element={<CashFlow />} />
          <Route path="advisor" element={<Advisor />} />
          <Route path="loan" element={<LoanEngine />} />
        </Route>

        {/* Catch-all to Redirect back to Landing or Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
