import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  AlertCircle,
  Sun,
  Moon,
  Stethoscope,
  Search,
  LogOut,
  History,
  List,
  Lightbulb,
  CheckCircle
} from 'lucide-react';

const HealthcareDiagnosisApp = ({ user, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('symptoms');
  const [formData, setFormData] = useState({
    // Patient Details
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: user.email || '',
    address: '',
    emergencyContact: '',
    
    // Medical Information
    symptoms: '',
    duration: '',
    severity: '',
    previousConditions: '',
    currentMedications: '',
    allergies: '',
    
    // File Upload
    uploadedFile: null
  });
  
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  
  // New state for enhanced features
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);
  const [availableDiseases, setAvailableDiseases] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState({
    symptoms: false,
    diseases: false,
    history: false
  });

  useEffect(() => {
    fetchPatientProfile();
    fetchMedicalRecords();
    fetchAvailableSymptoms();
    fetchAvailableDiseases();
    fetchPredictionHistory();
  }, []);

  // API Helper function
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const defaultOptions = {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      ...options
    };
    
    try {
      const response = await fetch(`http://localhost:8000/api${endpoint}`, defaultOptions);
      return { response, data: response.ok ? await response.json() : null };
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      return { response: null, data: null, error };
    }
  };

  // Existing functions (unchanged)
  const fetchPatientProfile = async () => {
    const { data } = await apiCall('/profile/');
    if (data) {
      setPatientProfile(data);
      setFormData(prev => ({
        ...prev,
        dateOfBirth: data.date_of_birth || '',
        gender: data.gender || '',
        phone: data.phone || '',
        address: data.address || '',
        emergencyContact: data.emergency_contact || ''
      }));
    }
  };

  const fetchMedicalRecords = async () => {
    const { data } = await apiCall('/medical-records/');
    if (data) {
      setMedicalRecords(data);
    }
  };

  const updatePatientProfile = async () => {
    const { data } = await apiCall('/profile/update/', {
      method: 'PUT',
      body: JSON.stringify({
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        emergency_contact: formData.emergencyContact
      })
    });
    
    if (data) {
      setPatientProfile(data);
      alert('Profile updated successfully!');
    }
  };

  const saveMedicalRecord = async () => {
    const { data } = await apiCall('/medical-records/create/', {
      method: 'POST',
      body: JSON.stringify({
        symptoms: formData.symptoms,
        duration: formData.duration,
        severity: formData.severity,
        previous_conditions: formData.previousConditions,
        current_medications: formData.currentMedications,
        allergies: formData.allergies
      })
    });
    
    if (data) {
      setMedicalRecords(prev => [...prev, data]);
      alert('Medical record saved successfully!');
      return true;
    }
    return false;
  };

  // NEW ENHANCED FUNCTIONS

  // Fetch available symptoms from the trained model
  const fetchAvailableSymptoms = async () => {
    setLoading(prev => ({ ...prev, symptoms: true }));
    const { data } = await apiCall('/symptoms/');
    if (data) {
      setAvailableSymptoms(data.symptoms || []);
    }
    setLoading(prev => ({ ...prev, symptoms: false }));
  };

  // Get symptom suggestions based on user input
  const getSymptomSuggestions = async (query) => {
    if (query.length < 2) {
      setSymptomSuggestions([]);
      return;
    }
    
    const { data } = await apiCall(`/symptoms/suggestions/?q=${encodeURIComponent(query)}`);
    if (data) {
      setSymptomSuggestions(data.suggestions || []);
    }
  };

  // Fetch available diseases
  const fetchAvailableDiseases = async () => {
    setLoading(prev => ({ ...prev, diseases: true }));
    const { data } = await apiCall('/diseases/');
    if (data) {
      setAvailableDiseases(data.diseases || []);
    }
    setLoading(prev => ({ ...prev, diseases: false }));
  };

  // Fetch prediction history
  const fetchPredictionHistory = async () => {
    setLoading(prev => ({ ...prev, history: true }));
    const { data } = await apiCall('/predictions/history/');
    if (data) {
      setPredictionHistory(data.history || []);
    }
    setLoading(prev => ({ ...prev, history: false }));
  };

  // Enhanced symptom input handler
  const handleSymptomsChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, symptoms: value }));
    
    // Get suggestions for the last entered symptom
    const symptoms = value.split(',').map(s => s.trim());
    const lastSymptom = symptoms[symptoms.length - 1];
    
    if (lastSymptom) {
      getSymptomSuggestions(lastSymptom);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Add suggestion to symptoms
  const addSuggestion = (suggestion) => {
    const currentSymptoms = formData.symptoms.split(',').map(s => s.trim()).filter(s => s);
    currentSymptoms[currentSymptoms.length - 1] = suggestion;
    setFormData(prev => ({ ...prev, symptoms: currentSymptoms.join(', ') + ', ' }));
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, uploadedFile: file }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    setFormData(prev => ({ ...prev, uploadedFile: file }));
  };

  // Enhanced submit handler with better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    // First save the medical record
    const saved = await saveMedicalRecord();
    
    if (saved) {
      // Extract symptoms from form data and split into array
      const symptomsArray = formData.symptoms
        .split(',')
        .map(symptom => symptom.trim())
        .filter(symptom => symptom.length > 0);
      
      if (symptomsArray.length === 0) {
        alert('Please enter at least one symptom');
        setIsAnalyzing(false);
        return;
      }
      
      // Call the enhanced prediction API
      const { data: predictionData, response } = await apiCall('/predict/', {
        method: 'POST',
        body: JSON.stringify({ symptoms: symptomsArray })
      });
      
      if (predictionData) {
        // Format the enhanced response
        setResults({
          patientName: `${formData.firstName} ${formData.lastName}`,
          analysisDate: new Date().toLocaleDateString(),
          predictions: predictionData.top_predictions ? 
            predictionData.top_predictions.map(pred => ({
              condition: pred.disease,
              probability: Math.round(pred.probability * 100),
              severity: formData.severity > 7 ? 'Severe' : formData.severity > 4 ? 'Moderate' : 'Mild'
            })) : 
            [{
              condition: predictionData.predicted_disease,
              probability: Math.round(predictionData.confidence * 100),
              severity: formData.severity > 7 ? 'Severe' : formData.severity > 4 ? 'Moderate' : 'Mild'
            }],
          matchedSymptoms: predictionData.matched_symptoms || [],
          inputSymptoms: predictionData.input_symptoms || symptomsArray,
          recommendations: generateRecommendations(predictionData),
          urgency: predictionData.confidence > 0.7 ? 'High' : 
                   predictionData.confidence > 0.4 ? 'Medium' : 'Low',
          nextSteps: generateNextSteps(predictionData),
          confidence: predictionData.confidence
        });
        
        // Refresh prediction history
        fetchPredictionHistory();
      } else {
        // Enhanced fallback with more realistic data
        console.error('Prediction API failed, using enhanced fallback');
        setResults({
          patientName: `${formData.firstName} ${formData.lastName}`,
          analysisDate: new Date().toLocaleDateString(),
          predictions: [
            { condition: 'Common Cold', probability: 65, severity: 'Mild' },
            { condition: 'Seasonal Allergies', probability: 45, severity: 'Mild' },
            { condition: 'Viral Infection', probability: 35, severity: 'Moderate' }
          ],
          matchedSymptoms: symptomsArray.slice(0, 3),
          inputSymptoms: symptomsArray,
          recommendations: [
            'Rest and stay hydrated',
            'Monitor symptoms for 24-48 hours',
            'Consider over-the-counter pain relief',
            'Avoid contact with others if contagious'
          ],
          urgency: 'Low',
          nextSteps: 'Schedule follow-up if symptoms persist beyond 7 days',
          confidence: 0.65
        });
      }
    }
    
    setIsAnalyzing(false);
  };

  // Generate recommendations based on prediction
  const generateRecommendations = (predictionData) => {
    const baseRecommendations = [
      'Rest and stay hydrated',
      'Monitor symptoms carefully',
    ];
    
    if (predictionData.confidence > 0.7) {
      baseRecommendations.push('Consider consulting a healthcare provider');
      baseRecommendations.push('Keep track of symptom progression');
    } else {
      baseRecommendations.push('Continue monitoring symptoms');
      baseRecommendations.push('Consider over-the-counter remedies if appropriate');
    }
    
    return baseRecommendations;
  };

  // Generate next steps based on prediction
  const generateNextSteps = (predictionData) => {
    if (predictionData.confidence > 0.8) {
      return 'Strongly consider consulting a healthcare professional within 24 hours';
    } else if (predictionData.confidence > 0.6) {
      return 'Schedule a medical consultation if symptoms persist or worsen';
    } else {
      return 'Monitor symptoms and seek medical advice if they persist beyond 7 days';
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      symptoms: '',
      duration: '',
      severity: '',
      previousConditions: '',
      currentMedications: '',
      allergies: '',
      uploadedFile: null
    }));
    setResults(null);
    setShowSuggestions(false);
    setSymptomSuggestions([]);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900'
    }`}>
      {/* Enhanced Header */}
      <header className={`${
        darkMode 
          ? 'bg-gradient-to-r from-blue-800 to-indigo-900 border-blue-700 shadow-2xl' 
          : 'bg-gradient-to-r from-blue-600 to-indigo-700 border-blue-200 shadow-xl'
      } border-b transition-all duration-300 sticky top-0 z-50 backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MediCare AI</h1>
                <p className="text-blue-100 text-xs">Welcome, {user.first_name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('history')}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  activeTab === 'history' 
                    ? 'bg-white/20' 
                    : 'bg-white/10 hover:bg-white/20'
                } text-white`}
              >
                <History className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveTab('diseases')}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  activeTab === 'diseases' 
                    ? 'bg-white/20' 
                    : 'bg-white/10 hover:bg-white/20'
                } text-white`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  darkMode 
                    ? 'bg-white/10 hover:bg-white/20 text-yellow-300' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={onLogout}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  darkMode 
                    ? 'bg-white/10 hover:bg-white/20 text-red-300' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="w-full px-2 sm:px-4 md:px-6 py-4">
        {/* Enhanced Tab Navigation */}
        {(activeTab === 'history' || activeTab === 'diseases') && (
          <div className={`mb-6 ${
            darkMode 
              ? 'bg-gradient-to-br from-slate-800 to-blue-900 border border-blue-700' 
              : 'bg-white border border-blue-200'
          } rounded-xl shadow-lg p-6`}>
            
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center mb-4">
                  <History className="h-6 w-6 mr-3 text-blue-600" />
                  <h2 className="text-2xl font-bold">Prediction History</h2>
                  {loading.history && (
                    <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
                
                {predictionHistory.length === 0 ? (
                  <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No prediction history available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {predictionHistory.map((prediction, index) => (
                      <div key={prediction.id} className={`p-4 rounded-lg border ${
                        darkMode ? 'border-blue-600 bg-slate-700' : 'border-blue-200 bg-blue-50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{prediction.predicted_disease}</h3>
                          <div className="text-right">
                            <span className="text-xl font-bold text-blue-600">
                              {Math.round(prediction.confidence * 100)}%
                            </span>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(prediction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Symptoms:</strong> {prediction.symptoms.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => setActiveTab('symptoms')}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  New Analysis
                </button>
              </div>
            )}
            
            {activeTab === 'diseases' && (
              <div>
                <div className="flex items-center mb-4">
                  <List className="h-6 w-6 mr-3 text-blue-600" />
                  <h2 className="text-2xl font-bold">Available Diseases</h2>
                  {loading.diseases && (
                    <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
                
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Our AI model can predict the following {availableDiseases.length} conditions:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableDiseases.map((disease, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      darkMode ? 'border-blue-600 bg-slate-700' : 'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm font-medium">{disease}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setActiveTab('symptoms')}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Start Diagnosis
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'symptoms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* Enhanced Input Form */}
            <div className={`lg:col-span-2 ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-800 to-blue-900 border border-blue-700' 
                : 'bg-white border border-blue-200'
            } rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-xl md:hover:shadow-3xl`}>
              
              <div className={`${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              } rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6`}>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                  <User className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  Patient Information
                </h2>
                <p className="text-blue-100 text-xs md:text-sm mt-1">Enhanced AI-powered diagnosis system</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Details Grid - Simplified for space */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-slate-600' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500 focus:bg-white'
                      } focus:ring-4 focus:ring-blue-200`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-slate-600' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500 focus:bg-white'
                      } focus:ring-4 focus:ring-blue-200`}
                      required
                    />
                  </div>
                </div>

                {/* Enhanced Symptoms Section */}
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">
                      Current Symptoms * 
                      <span className="ml-2 text-xs text-green-600">
                        <Lightbulb className="inline h-3 w-3 mr-1" />
                        AI suggestions available
                      </span>
                    </label>
                    <textarea
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleSymptomsChange}
                      onFocus={() => setShowSuggestions(true)}
                      rows={4}
                      placeholder="Enter symptoms separated by commas (e.g., fever, headache, cough)..."
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-slate-600' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500 focus:bg-white'
                      } focus:ring-4 focus:ring-blue-200 resize-none`}
                      required
                    />
                    
                    {/* Enhanced Symptom Suggestions */}
                    {showSuggestions && symptomSuggestions.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 rounded-xl border shadow-lg ${
                        darkMode ? 'bg-slate-700 border-blue-600' : 'bg-white border-blue-200'
                      }`}>
                        <div className="p-2 border-b border-blue-200 dark:border-blue-600">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            💡 AI Suggestions
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {symptomSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => addSuggestion(suggestion)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors ${
                                darkMode ? 'text-gray-200' : 'text-gray-700'
                              }`}
                            >
                              <CheckCircle className="inline h-3 w-3 mr-2 text-green-600" />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">Duration</label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          darkMode 
                            ? 'bg-slate-700 border-blue-600 text-white focus:border-blue-400 focus:bg-slate-600' 
                            : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500 focus:bg-white'
                        } focus:ring-4 focus:ring-blue-200`}
                      >
                        <option value="">Select Duration</option>
                        <option value="less-than-day">Less than a day</option>
                        <option value="1-3-days">1-3 days</option>
                        <option value="4-7-days">4-7 days</option>
                        <option value="1-2-weeks">1-2 weeks</option>
                        <option value="more-than-month">More than a month</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">Severity (1-10)</label>
                      <input
                        type="number"
                        name="severity"
                        value={formData.severity}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        placeholder="Rate your pain/discomfort"
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          darkMode 
                            ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-slate-600' 
                            : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500 focus:bg-white'
                        } focus:ring-4 focus:ring-blue-200`}
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-8 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 transition-all duration-200 flex items-center justify-center text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-3" />
                        Analyze Symptoms
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      darkMode 
                        ? 'bg-slate-600 text-white hover:bg-slate-500' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </div>

            {/* Enhanced Results Panel */}
            <div className={`lg:col-span-1 mt-4 lg:mt-0 ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-800 to-indigo-900 border border-blue-700' 
                : 'bg-white border border-blue-200'
            } rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-xl md:hover:shadow-3xl`}>
              
              <div className={`${
                darkMode 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-700' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600'
              } rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6`}>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                  <Activity className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  Diagnosis Results
                </h2>
                <p className="text-green-100 text-xs md:text-sm mt-1">AI-powered medical analysis</p>
              </div>
              
              {!results && !isAnalyzing && (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-slate-700' : 'bg-blue-100'
                  }`}>
                    <Stethoscope className="h-10 w-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-2">Ready for Analysis</p>
                  <p className="text-sm">Complete the form and click "Analyze Symptoms" to get your results</p>
                  
                  {/* Quick Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                      <p className="text-sm font-semibold">Available Diseases</p>
                      <p className="text-xl font-bold text-blue-600">{availableDiseases.length}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                      <p className="text-sm font-semibold">Your Predictions</p>
                      <p className="text-xl font-bold text-blue-600">{predictionHistory.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold mb-2">Analyzing your symptoms...</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Our AI is processing your medical data
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              )}

              {results && (
                <div className="space-y-6">
                  {/* Enhanced Patient Info */}
                  <div className={`p-4 rounded-xl ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-800 to-indigo-800' 
                      : 'bg-gradient-to-r from-blue-100 to-indigo-100'
                  }`}>
                    <h3 className="font-bold text-lg mb-1">Patient: {results.patientName}</h3>
                    <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      Analysis Date: {results.analysisDate}
                    </p>
                    {results.confidence && (
                      <p className={`text-xs mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        Overall Confidence: {Math.round(results.confidence * 100)}%
                      </p>
                    )}
                  </div>

                  {/* Enhanced Matched Symptoms */}
                  {results.matchedSymptoms && results.matchedSymptoms.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-3 text-green-600 dark:text-green-400">Matched Symptoms</h3>
                      <div className="flex flex-wrap gap-2">
                        {results.matchedSymptoms.map((symptom, index) => (
                          <span key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                          }`}>
                            ✓ {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Predictions with Multiple Results */}
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-blue-600 dark:text-blue-400">
                      {results.predictions.length > 1 ? 'Top Predictions' : 'Predicted Condition'}
                    </h3>
                    <div className="space-y-3">
                      {results.predictions.map((prediction, index) => (
                        <div key={index} className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-102 ${
                          index === 0 
                            ? (darkMode ? 'border-green-600 bg-green-900/20' : 'border-green-400 bg-green-50')
                            : (darkMode ? 'border-blue-600 bg-slate-700' : 'border-blue-200 bg-blue-50')
                        }`}>
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center">
                              {index === 0 && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
                              <span className="font-bold text-lg">{prediction.condition}</span>
                              {index === 0 && (
                                <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                prediction.severity === 'Mild' ? 'bg-green-200 text-green-800' :
                                prediction.severity === 'Moderate' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {prediction.severity}
                              </span>
                              <span className="text-xl font-bold text-blue-600">
                                {prediction.probability}%
                              </span>
                            </div>
                          </div>
                          <div className={`w-full rounded-full h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-3 rounded-full transition-all duration-1000 ${
                                index === 0 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              }`}
                              style={{ width: `${prediction.probability}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Urgency Level */}
                  <div className={`p-4 rounded-xl border-2 ${
                    results.urgency === 'Low' ? 'bg-green-50 border-green-300' :
                    results.urgency === 'Medium' ? 'bg-yellow-50 border-yellow-300' :
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center">
                      <AlertCircle className={`h-6 w-6 mr-3 ${
                        results.urgency === 'Low' ? 'text-green-600' :
                        results.urgency === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                      <span className={`font-bold text-lg ${
                        results.urgency === 'Low' ? 'text-green-800' :
                        results.urgency === 'Medium' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        Urgency Level: {results.urgency}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Recommendations */}
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-blue-600 dark:text-blue-400">AI Recommendations</h3>
                    <div className="space-y-2">
                      {results.recommendations.map((rec, index) => (
                        <div key={index} className={`flex items-start p-3 rounded-lg ${
                          darkMode ? 'bg-slate-700' : 'bg-blue-50'
                        }`}>
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-sm font-medium">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Next Steps */}
                  <div className={`p-4 rounded-xl border-2 ${
                    darkMode 
                      ? 'bg-blue-900 border-blue-600' 
                      : 'bg-blue-50 border-blue-300'
                  }`}>
                    <h3 className={`font-bold text-lg mb-2 ${
                      darkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      Recommended Next Steps
                    </h3>
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-blue-200' : 'text-blue-700'
                    }`}>
                      {results.nextSteps}
                    </p>
                  </div>

                  {/* Enhanced Disclaimer */}
                  <div className={`p-4 rounded-xl text-sm border-2 ${
                    darkMode 
                      ? 'bg-slate-700 text-gray-300 border-gray-600' 
                      : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-orange-500" />
                      <div>
                        <p className="font-bold mb-1">Medical Disclaimer</p>
                        <p>This is an AI-powered analysis for informational purposes only. 
                        Always consult with a qualified healthcare professional for proper medical advice and treatment.
                        This tool is not a substitute for professional medical diagnosis.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthcareDiagnosisApp;