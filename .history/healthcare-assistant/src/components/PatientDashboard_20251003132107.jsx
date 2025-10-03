import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  AlertCircle,
  Sun,
  Moon,
  Search,
  LogOut,
  History,
  FileText,
  Edit3,
  Save,
  X,
  Heart,
  Pill,
  Clock,
  TrendingUp,
  CheckCircle,
  Lightbulb
} from 'lucide-react';

const PatientDashboard = ({ user, token, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [patientProfile, setPatientProfile] = useState({});
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState({
    profile: false,
    records: false,
    history: false,
    stats: false
  });

  // Form data for symptoms analysis
  const [symptomForm, setSymptomForm] = useState({
    symptoms: '',
    duration: '',
    severity: '',
    previousConditions: '',
    currentMedications: '',
    allergies: ''
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchPatientProfile();
    fetchMedicalRecords();
    fetchPredictionHistory();
    fetchStatistics();
  }, []);

  // API Helper function
  const apiCall = async (endpoint, options = {}) => {
    const defaultOptions = {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      ...options
    };
    
    try {
      const response = await fetch(`http://localhost:8000/api${endpoint}`, defaultOptions);
      const data = response.ok ? await response.json() : null;
      return { response, data };
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      return { response: null, data: null, error };
    }
  };

  const fetchPatientProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    const { data } = await apiCall('/patient/profile/');
    if (data) {
      setPatientProfile(data);
    }
    setLoading(prev => ({ ...prev, profile: false }));
  };

  const fetchMedicalRecords = async () => {
    setLoading(prev => ({ ...prev, records: true }));
    const { data } = await apiCall('/medical-records/');
    if (data) {
      setMedicalRecords(data);
    }
    setLoading(prev => ({ ...prev, records: false }));
  };

  const fetchPredictionHistory = async () => {
    setLoading(prev => ({ ...prev, history: true }));
    const { data } = await apiCall('/predictions/history/');
    if (data) {
      setPredictionHistory(data.history || []);
    }
    setLoading(prev => ({ ...prev, history: false }));
  };

  const fetchStatistics = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    const { data } = await apiCall('/statistics/');
    if (data) {
      setStatistics(data);
    }
    setLoading(prev => ({ ...prev, stats: false }));
  };

  const updatePatientProfile = async () => {
    const { data } = await apiCall('/patient/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(patientProfile)
    });
    
    if (data) {
      setPatientProfile(data);
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    }
  };

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

  const handleSymptomsChange = (e) => {
    const value = e.target.value;
    setSymptomForm(prev => ({ ...prev, symptoms: value }));
    
    const symptoms = value.split(',').map(s => s.trim());
    const lastSymptom = symptoms[symptoms.length - 1];
    
    if (lastSymptom) {
      getSymptomSuggestions(lastSymptom);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addSuggestion = (suggestion) => {
    const currentSymptoms = symptomForm.symptoms.split(',').map(s => s.trim()).filter(s => s);
    currentSymptoms[currentSymptoms.length - 1] = suggestion;
    setSymptomForm(prev => ({ ...prev, symptoms: currentSymptoms.join(', ') + ', ' }));
    setShowSuggestions(false);
  };

  const handleSymptomSubmit = async () => {
    if (!symptomForm.symptoms.trim()) {
      alert('Please enter at least one symptom');
      return;
    }

    setIsAnalyzing(true);

    const severityMap = {
    '1': 'mild', '2': 'mild', '3': 'mild',
    '4': 'moderate', '5': 'moderate', '6': 'moderate', 
    '7': 'severe', '8': 'severe', '9': 'severe', '10': 'severe'
  };
  
  const severityString = severityMap[symptomForm.severity] || 'mild';
    
    // First save the medical record
    const { data: recordData } = await apiCall('/medical-records/create/', {
      method: 'POST',
      body: JSON.stringify({
        symptoms: symptomForm.symptoms,
        duration: symptomForm.duration,
        severity: symptomForm.severity,
        previous_conditions: symptomForm.previousConditions,
        current_medications: symptomForm.currentMedications,
        allergies: symptomForm.allergies
      })
    });
    
    if (recordData) {
      setMedicalRecords(prev => [...prev, recordData]);
      
      // Then get AI prediction
      const symptomsArray = symptomForm.symptoms
        .split(',')
        .map(symptom => symptom.trim())
        .filter(symptom => symptom.length > 0);
      
      const { data: predictionData } = await apiCall('/predict/', {
        method: 'POST',
        body: JSON.stringify({ symptoms: symptomsArray })
      });
      
      if (predictionData) {
        setAnalysisResult({
          patientName: `${user.first_name} ${user.last_name}`,
          analysisDate: new Date().toLocaleDateString(),
          predictions: predictionData.top_predictions ? 
            predictionData.top_predictions.map(pred => ({
              condition: pred.disease,
              probability: Math.round(pred.probability * 100),
              severity: symptomForm.severity > 7 ? 'Severe' : symptomForm.severity > 4 ? 'Moderate' : 'Mild'
            })) : 
            [{
              condition: predictionData.predicted_disease,
              probability: Math.round(predictionData.confidence * 100),
              severity: symptomForm.severity > 7 ? 'Severe' : symptomForm.severity > 4 ? 'Moderate' : 'Mild'
            }],
          confidence: predictionData.confidence,
          matchedSymptoms: predictionData.matched_symptoms || [],
          recommendations: [
            'Consult with a healthcare professional',
            'Monitor symptoms carefully',
            'Rest and stay hydrated',
            'Keep track of symptom progression'
          ]
        });
        
        fetchPredictionHistory();
      }
    }
    
    setIsAnalyzing(false);
  };

  const resetSymptomForm = () => {
    setSymptomForm({
      symptoms: '',
      duration: '',
      severity: '',
      previousConditions: '',
      currentMedications: '',
      allergies: ''
    });
    setAnalysisResult(null);
    setShowSuggestions(false);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`${
        darkMode 
          ? 'bg-gradient-to-r from-green-800 to-emerald-900 border-green-700 shadow-2xl' 
          : 'bg-gradient-to-r from-green-600 to-emerald-700 border-green-200 shadow-xl'
      } border-b transition-all duration-300 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Patient Portal</h1>
                <p className="text-green-100 text-xs">Welcome back, {user.first_name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white/10 hover:bg-white/20 text-white"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={onLogout}
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white/10 hover:bg-white/20 text-white"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className={`${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        } rounded-xl shadow-lg border p-2`}>
          <div className="flex space-x-2">
            {[
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'symptoms', label: 'Symptom Check', icon: Search },
              { id: 'records', label: 'Medical Records', icon: FileText },
              { id: 'history', label: 'Analysis History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? (darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white')
                    : (darkMode ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={`${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          } rounded-xl shadow-lg border p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <User className="h-6 w-6 mr-3 text-green-600" />
                Patient Profile
              </h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isEditingProfile
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isEditingProfile ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {loading.profile ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2">Loading profile...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      value={patientProfile.first_name || user.first_name || ''}
                      onChange={(e) => setPatientProfile(prev => ({ ...prev, first_name: e.target.value }))}
                      disabled={!isEditingProfile}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={patientProfile.last_name || user.last_name || ''}
                      onChange={(e) => setPatientProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      disabled={!isEditingProfile}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={patientProfile.date_of_birth || ''}
                      onChange={(e) => setPatientProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      disabled={!isEditingProfile}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Gender</label>
                    <select
                      value={patientProfile.gender || ''}
                      onChange={(e) => setPatientProfile(prev => ({ ...prev, gender: e.target.value }))}
                      disabled={!isEditingProfile}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={patientProfile.email || user.email || ''}
                        onChange={(e) => setPatientProfile(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditingProfile}
                        className={`w-full px-4 py-3 rounded-xl border transition-all ${
                          isEditingProfile
                            ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                        }`}
                      />
                      <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={patientProfile.phone || ''}
                        onChange={(e) => setPatientProfile(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditingProfile}
                        placeholder="Enter your phone number"
                        className={`w-full px-4 py-3 rounded-xl border transition-all ${
                          isEditingProfile
                            ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                        }`}
                      />
                      <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <div className="relative">
                      <textarea
                        value={patientProfile.address || ''}
                        onChange={(e) => setPatientProfile(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!isEditingProfile}
                        rows={3}
                        placeholder="Enter your address"
                        className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                          isEditingProfile
                            ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                        }`}
                      />
                      <MapPin className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Contact</label>
                    <input
                      type="text"
                      value={patientProfile.emergency_contact || ''}
                      onChange={(e) => setPatientProfile(prev => ({ ...prev, emergency_contact: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Emergency contact name and number"
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-green-600 text-white' : 'bg-white border-green-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {isEditingProfile && (
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePatientProfile}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Symptoms Tab */}
        {activeTab === 'symptoms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-lg border p-6`}>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Search className="h-6 w-6 mr-3 text-blue-600" />
                Symptom Checker
              </h2>

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
                    value={symptomForm.symptoms}
                    onChange={handleSymptomsChange}
                    onFocus={() => setShowSuggestions(true)}
                    rows={4}
                    placeholder="Enter symptoms separated by commas (e.g., fever, headache, cough)..."
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                      darkMode 
                        ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-slate-600' 
                        : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500 focus:bg-white'
                    } focus:ring-4 focus:ring-blue-200`}
                    required
                  />
                  
                  {showSuggestions && symptomSuggestions.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 rounded-xl border shadow-lg ${
                      darkMode ? 'bg-slate-700 border-blue-600' : 'bg-white border-blue-200'
                    }`}>
                      <div className="p-2 border-b border-blue-200 dark:border-blue-600">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          AI Suggestions
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
                    <label className="block text-sm font-semibold mb-2">Duration</label>
                    <select
                      value={symptomForm.duration}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, duration: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white focus:border-blue-400' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500'
                      }`}
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
                    <label className="block text-sm font-semibold mb-2">Severity (1-10)</label>
                    <input
                      type="number"
                      value={symptomForm.severity}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, severity: e.target.value }))}
                      min="1"
                      max="10"
                      placeholder="Rate severity"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Previous Medical Conditions</label>
                  <textarea
                    value={symptomForm.previousConditions}
                    onChange={(e) => setSymptomForm(prev => ({ ...prev, previousConditions: e.target.value }))}
                    rows={2}
                    placeholder="List any previous medical conditions..."
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                      darkMode 
                        ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400' 
                        : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Current Medications</label>
                    <textarea
                      value={symptomForm.currentMedications}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, currentMedications: e.target.value }))}
                      rows={2}
                      placeholder="List current medications..."
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Allergies</label>
                    <textarea
                      value={symptomForm.allergies}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, allergies: e.target.value }))}
                      rows={2}
                      placeholder="List any allergies..."
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                        darkMode 
                          ? 'bg-slate-700 border-blue-600 text-white placeholder-gray-400 focus:border-blue-400' 
                          : 'bg-blue-50 border-blue-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleSymptomSubmit}
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
                        <Activity className="h-5 w-5 mr-3" />
                        Analyze Symptoms
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetSymptomForm}
                    className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      darkMode 
                        ? 'bg-slate-600 text-white hover:bg-slate-500' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className={`lg:col-span-1 ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-lg border p-6`}>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Analysis Results
              </h2>

              {!analysisResult && !isAnalyzing && (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-slate-700' : 'bg-blue-100'
                  }`}>
                    <Activity className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="font-medium mb-2">Ready for Analysis</p>
                  <p className="text-sm">Enter your symptoms and click analyze to get AI-powered health insights</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-lg font-bold mb-2">Analyzing symptoms...</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    AI is processing your health data
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${
                    darkMode ? 'bg-gradient-to-r from-green-800 to-emerald-800' : 'bg-gradient-to-r from-green-100 to-emerald-100'
                  }`}>
                    <h3 className="font-bold text-lg">Analysis Complete</h3>
                    <p className={`text-sm ${darkMode ? 'text-green-200' : 'text-green-700'}`}>
                      {analysisResult.analysisDate}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">
                      Predicted Conditions
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.predictions.map((prediction, index) => (
                        <div key={index} className={`p-3 rounded-xl border-2 ${
                          index === 0 
                            ? (darkMode ? 'border-green-600 bg-green-900/20' : 'border-green-400 bg-green-50')
                            : (darkMode ? 'border-blue-600 bg-slate-700' : 'border-blue-200 bg-blue-50')
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">{prediction.condition}</span>
                            <span className="text-lg font-bold text-blue-600">
                              {prediction.probability}%
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-2 rounded-full ${
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

                  {analysisResult.matchedSymptoms.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-green-600 dark:text-green-400">
                        Matched Symptoms
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.matchedSymptoms.map((symptom, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                          }`}>
                            ✓ {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">
                      Recommendations
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <div key={index} className={`flex items-start p-2 rounded-lg ${
                          darkMode ? 'bg-slate-700' : 'bg-blue-50'
                        }`}>
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border-2 ${
                    darkMode ? 'bg-slate-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-orange-500" />
                      <div>
                        <p className="text-xs font-bold mb-1">Disclaimer</p>
                        <p className="text-xs">This is AI analysis for informational purposes only. Always consult healthcare professionals for medical advice.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medical Records Tab */}
        {activeTab === 'records' && (
          <div className={`${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          } rounded-xl shadow-lg border p-6`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-3 text-blue-600" />
              My Medical Records
            </h2>

            {loading.records ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading medical records...</p>
              </div>
            ) : medicalRecords.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">No medical records found</p>
                <p className="text-sm">Your symptom analysis records will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicalRecords.map((record, index) => (
                  <div key={record.id} className={`p-6 rounded-xl border ${
                    darkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg">Record #{record.id}</h3>
                      <div className="text-right">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(record.created_at).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(record.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-red-500" />
                          Symptoms
                        </h4>
                        <p className={`text-sm p-3 rounded-lg ${
                          darkMode ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          {record.symptoms}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-blue-500" />
                          Duration & Severity
                        </h4>
                        <div className={`text-sm p-3 rounded-lg ${
                          darkMode ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          <p>Duration: {record.duration || 'Not specified'}</p>
                          <p>Severity: {record.severity ? `${record.severity}/10` : 'Not specified'}</p>
                        </div>
                      </div>
                      
                      {record.current_medications && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center">
                            <Pill className="h-4 w-4 mr-2 text-green-500" />
                            Medications
                          </h4>
                          <p className={`text-sm p-3 rounded-lg ${
                            darkMode ? 'bg-slate-600' : 'bg-white'
                          }`}>
                            {record.current_medications}
                          </p>
                        </div>
                      )}
                      
                      {record.allergies && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                            Allergies
                          </h4>
                          <p className={`text-sm p-3 rounded-lg ${
                            darkMode ? 'bg-slate-600' : 'bg-white'
                          }`}>
                            {record.allergies}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {record.previous_conditions && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                          Previous Conditions
                        </h4>
                        <p className={`text-sm p-3 rounded-lg ${
                          darkMode ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          {record.previous_conditions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className={`${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          } rounded-xl shadow-lg border p-6`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <History className="h-6 w-6 mr-3 text-purple-600" />
              AI Analysis History
            </h2>

            {loading.history ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2">Loading analysis history...</p>
              </div>
            ) : predictionHistory.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">No analysis history found</p>
                <p className="text-sm">Your AI predictions will appear here after you analyze symptoms</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictionHistory.map((prediction, index) => (
                  <div key={prediction.id} className={`p-6 rounded-xl border ${
                    darkMode ? 'border-purple-600 bg-purple-900/20' : 'border-purple-200 bg-purple-50'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-purple-600 dark:text-purple-400">
                          {prediction.predicted_disease}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Confidence: {Math.round(prediction.confidence * 100)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(prediction.created_at).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(prediction.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Analyzed Symptoms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {prediction.symptoms.map((symptom, symptomIndex) => (
                          <span key={symptomIndex} className={`px-3 py-1 rounded-full text-sm font-medium ${
                            darkMode ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`mt-4 w-full rounded-full h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                        style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;