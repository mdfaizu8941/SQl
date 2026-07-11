import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Database from './pages/Database';
import History from './pages/History';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import { ThemeProvider } from './components/ThemeProvider';

import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const isPublicPage = ['/login', '/register', '/verify-otp', '/forgot-password', '/'].includes(location.pathname);

  return (
    <div className="flex h-screen bg-background overflow-hidden antialiased">
      {!isPublicPage && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${!isPublicPage ? 'px-4 sm:px-6 md:px-8 pt-20 md:pt-6 pb-6 w-full max-w-[1400px] mx-auto' : ''}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/database" element={<Database />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster position="top-right" theme="system" richColors />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
