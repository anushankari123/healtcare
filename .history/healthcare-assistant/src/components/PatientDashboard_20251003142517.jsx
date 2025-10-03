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

  const handleSeverityChange = (e) => {
  const value = e.target.value;
  // Only allow numbers 1-10 or empty string
  if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 10)) {
    setSymptomForm(prev => ({ ...prev, severity: value }));
  }
};

  const convertSeverityToString = (severityNumber) => {
  const severityMap = {
    '1': 'mild', '2': 'mild', '3': 'mild',
    '4': 'moderate', '5': 'moderate', '6': 'moderate',
    '7': 'severe', '8': 'severe', '9': 'severe', '10': 'severe'
  };
  return severityMap[severityNumber] || 'mild';
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

    const severityString = convertSeverityToString(symptomForm.severity);
    
    // First save the medical record
    const { data: recordData } = await apiCall('/medical-records/create/', {
      method: 'POST',
      body: JSON.stringify({
        symptoms: symptomForm.symptoms,
        duration: symptomForm.duration,
        severity: severityString,
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
    <div className={`min-vh-100 min-vw-100 transition-all duration-300 ${
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
        <div className="container-fluid px-4">
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
      <div className="container-fluid px-4 py-4">
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

      {/* All tab content wrapped in a single div to avoid adjacent JSX error */}
      <div>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          // ...existing code for profile tab...
          <>{/* ...profile tab content... */}</>
        )}
        {/* Symptoms Tab */}
        {activeTab === 'symptoms' && (
          // ...existing code for symptoms tab...
          <>{/* ...symptoms tab content... */}</>
        )}
        {/* Medical Records Tab */}
        {activeTab === 'records' && (
          // ...existing code for records tab...
          <>{/* ...records tab content... */}</>
        )}
        {/* History Tab */}
        {activeTab === 'history' && (
          // ...existing code for history tab...
          <>{/* ...history tab content... */}</>
        )}
      </div>
    </div>
};

export default PatientDashboard;