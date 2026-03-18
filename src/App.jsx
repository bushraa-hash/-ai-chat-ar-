import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';

// A generic wrapper for pages requiring auth
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">جاري التحميل...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen font-sans bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
      <Routes>
        <Route path="/login" element={<><Navbar /><Login /></>} />
        <Route path="/register" element={<><Navbar /><Register /></>} />
        
        {/* Protected Routes */}
        <Route 
            path="/" 
            element={
                <PrivateRoute>
                    <Dashboard />
                </PrivateRoute>
            } 
        />
        <Route 
            path="/dashboard" 
            element={<Navigate to="/" replace />} 
        />
        <Route 
            path="/settings" 
            element={
                <PrivateRoute>
                    <><Navbar /><Settings /></>
                </PrivateRoute>
            } 
        />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
