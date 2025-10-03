import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, Stethoscope, UserCheck, Activity, Heart, Shield } from 'lucide-react';

const Login = ({ onLogin, switchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store in memory instead of localStorage
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="h-12 w-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MediCare AI</span>
          </div>
          
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Welcome to Your<br />Healthcare Portal
          </h1>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Access your medical records, connect with healthcare providers, and manage your health journey—all in one secure place.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Secure & Private</h3>
                <p className="text-blue-200 text-sm">Your health data is protected with enterprise-grade encryption</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Real-Time Updates</h3>
                <p className="text-blue-200 text-sm">Stay informed with instant notifications and health insights</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">Comprehensive Care</h3>
                <p className="text-blue-200 text-sm">Connect with doctors and access your complete health history</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            © 2024 MediCare AI. Empowering healthcare through technology.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
          <div>
            <div className="lg:hidden mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your healthcare dashboard
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Or{' '}
              <button
                onClick={switchToRegister}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                create a new account
              </button>
            </p>
          </div>

          {/* User Type Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-blue-800 text-center">Patient</p>
              <p className="text-xs text-blue-600 text-center">View health records</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-green-800 text-center">Doctor</p>
              <p className="text-xs text-green-600 text-center">Manage care</p>
            </div>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter your username"
                  />
                  <User className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3.5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-600 font-medium">Patient:</span>
                <span className="text-gray-600">patient1 / password</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 font-medium">Doctor:</span>
                <span className="text-gray-600">doctor1 / password</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;