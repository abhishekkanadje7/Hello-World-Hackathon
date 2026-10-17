import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import NewTicketPage from './pages/customer/NewTicketPage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import TicketDetailPage from './pages/customer/TicketDetailPage';
import DashboardPage from './pages/DashboardPage';
import AgentQueuePage from './pages/agent/AgentQueuePage';
import AgentTicketDetailPage from './pages/agent/AgentTicketDetailPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';
import ProfilePage from './pages/ProfilePage';
import { initWebSocket } from './api';

function AppContent() {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const ws = initWebSocket(
      () => {},
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar wsConnected={wsConnected} />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Change Password Route (Accessible to all authenticated users) */}
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } 
          />

          {/* User Profile Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* Customer Portal Routes */}
          <Route 
            path="/customer/new" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <NewTicketPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/tickets" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MyTicketsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/tickets/:id" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <TicketDetailPage />
              </ProtectedRoute>
            } 
          />

          {/* Agent Portal Routes */}
          <Route 
            path="/agent" 
            element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <AgentQueuePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/agent/tickets/:id" 
            element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <AgentTicketDetailPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Portal Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortalPage />
              </ProtectedRoute>
            } 
          />

          {/* Live Simulator & Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <DashboardPage wsConnected={wsConnected} />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white font-mono">TriageX 2.1</span>
            <span>• Predictive Customer Support Triage & Sentiment Router</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Hello World 2026 | ACSES × Semicolon</span>
            <span className="text-slate-700">|</span>
            <span className="text-blue-400 font-semibold">Team TriageX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
