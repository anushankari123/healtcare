import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import HealthcareDiagnosisApp from './components/HealthcareDiagnosisApp';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('app');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setCurrentView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('login');
  };

  const switchToRegister = () => setCurrentView('register');
  const switchToLogin = () => setCurrentView('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'login' && (
        <Login onLogin={handleLogin} switchToRegister={switchToRegister} />
      )}
      {currentView === 'register' && (
        <Register onRegister={handleRegister} switchToLogin={switchToLogin} />
      )}
      {currentView === 'app' && user && (
        <HealthcareDiagnosisApp user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;