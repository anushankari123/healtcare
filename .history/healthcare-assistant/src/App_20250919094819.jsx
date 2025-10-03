import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (storedToken && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setToken(storedToken);
        setCurrentView('app');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentView('app');
    
    // Store in localStorage for persistence
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleRegister = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentView('app');
    
    // Store in localStorage for persistence
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setCurrentView('login');
  };

  const switchToRegister = () => setCurrentView('register');
  const switchToLogin = () => setCurrentView('login');

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading MediCare AI</div>
          <div className="text-sm text-gray-500">Initializing your healthcare platform...</div>
        </div>
      </div>
    );
  }

  // Render appropriate component based on current view and user role
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <Login 
            onLogin={handleLogin} 
            switchToRegister={switchToRegister} 
          />
        );
      
      case 'register':
        return (
          <Register 
            onRegister={handleRegister} 
            switchToLogin={switchToLogin} 
          />
        );
      
      case 'app':
        if (!user || !token) {
          // If somehow we get here without user data, redirect to login
          setCurrentView('login');
          return null;
        }
        
        // Route based on user type
        if (user.user_type === 'doctor') {
          return (
            <DoctorDashboard 
              user={user} 
              token={token} 
              onLogout={handleLogout} 
            />
          );
        } else {
          // Default to patient dashboard (includes 'patient' type and any legacy users)
          return (
            <PatientDashboard 
              user={user} 
              token={token} 
              onLogout={handleLogout} 
            />
          );
        }
      
      default:
        return (
          <Login 
            onLogin={handleLogin} 
            switchToRegister={switchToRegister} 
          />
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
}

export default App;