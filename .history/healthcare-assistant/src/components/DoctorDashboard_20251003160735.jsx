import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { 
  Stethoscope, 
  Users, 
  Activity, 
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  Calendar,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  X,
  Filter,
  TrendingUp,
  FileText,
  AlertCircle,
  Clock,
  Brain,
  Download,
  Edit3,
  Save,
  MapPin,
  Award,
  BarChart3,
  Plus
} from 'lucide-react';

const DoctorDashboard = ({ user = { first_name: "John", last_name: "Smith", email: "dr.smith@hospital.com" }, token = "demo_token", onLogout = () => console.log("Logout clicked") }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('quickActions');
  const [patients, setPatients] = useState([
    {
      id: 1,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@email.com",
      phone: "+1-555-0123",
      last_analysis: "2024-01-15",
      pending_reviews: 2,
      date_joined: "2023-12-01",
      last_login: "2024-01-15"
    },
    {
      id: 2,
      first_name: "Bob",
      last_name: "Johnson",
      email: "bob.johnson@email.com",
      phone: "+1-555-0456",
      last_analysis: "2024-01-10",
      pending_reviews: 0,
      date_joined: "2023-11-15",
      last_login: "2024-01-12"
    }
  ]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState({
    first_name: "John",
    last_name: "Smith",
    email: "dr.smith@hospital.com",
    specialization: "Internal Medicine",
    license_number: "MD123456",
    phone: "+1-555-9999",
    hospital: "City General Hospital",
    address: "123 Medical Center Dr, City, ST 12345",
    years_experience: "15"
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState({
    patients: false,
    patient: false,
    profile: false,
    analysis: false
  });

  // AI Analysis state
  const [analysisForm, setAnalysisForm] = useState({
    symptoms: '',
    patientId: null
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchAllPatients();
    fetchDoctorProfile();
  }, []);

  // API Helper function
  // Updated API Helper function
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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    return { response: null, data: null, error: error.message };
  }
};

// Add these state variables
const [realPatients, setRealPatients] = useState([]);
const [doctorStats, setDoctorStats] = useState({
  total_patients: 0,
  total_predictions: 0,
  recent_predictions: 0,
  doctor_analyses: 0
});

  // Replace fetchAllPatients
const fetchAllPatients = async () => {
  setLoading(prev => ({ ...prev, patients: true }));
  const { data, error } = await apiCall('/doctor/patients/');
  
  if (data && data.patients) {
    setRealPatients(data.patients);
  } else {
    console.error('Failed to fetch patients:', error);
    // Keep mock data as fallback
  }
  setLoading(prev => ({ ...prev, patients: false }));
};

// Replace fetchDoctorProfile
const fetchDoctorProfile = async () => {
  setLoading(prev => ({ ...prev, profile: true }));
  const { data } = await apiCall('/doctor/profile/');
  
  if (data) {
    setDoctorProfile(prev => ({
      ...prev,
      ...data,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    }));
  }
  setLoading(prev => ({ ...prev, profile: false }));
};

// Add fetchDoctorStatistics
const fetchDoctorStatistics = async () => {
  const { data } = await apiCall('/statistics/');
  if (data) {
    setDoctorStats(data);
  }
};

// Replace fetchPatientDetails with real API
const fetchPatientDetails = async (patientId) => {
  setLoading(prev => ({ ...prev, patient: true }));
  
  try {
    // Fetch patient details
    const { data: patientData } = await apiCall(`/doctor/patients/${patientId}/`);
    
    if (patientData) {
      // Fetch medical records for this patient
      const { data: recordsData } = await apiCall(`/doctor/patients/${patientId}/medical-records/`);
      
      // Fetch AI predictions for this patient
      const { data: predictionsData } = await apiCall(`/doctor/patients/${patientId}/predictions/`);
      
      setSelectedPatient({
        ...patientData,
        medical_records: recordsData?.records || [],
        predictions: predictionsData?.predictions || []
      });
    }
  } catch (error) {
    console.error('Error fetching patient details:', error);
    // Fallback to mock data if API fails
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient({
        ...patient,
        date_of_birth: "1990-05-15",
        gender: "Female",
        medical_records: [],
        predictions: []
      });
    }
  }
  
  setLoading(prev => ({ ...prev, patient: false }));
};

// Update the approveAnalysis function
const approveAnalysis = async (predictionId) => {
  try {
    const { data, error } = await apiCall(`/predictions/${predictionId}/approve/`, {
      method: 'POST'
    });
    
    if (data) {
      alert('Analysis approved successfully!');
      // Refresh the patient details to show updated status
      if (selectedPatient) {
        fetchPatientDetails(selectedPatient.id);
      }
    } else {
      alert(`Approval failed: ${error}`);
    }
  } catch (err) {
    console.error('Error approving analysis:', err);
    alert('Approval failed. Please try again.');
  }
};

// Update useEffect to fetch real data
useEffect(() => {
  fetchAllPatients();
  fetchDoctorProfile();
  fetchDoctorStatistics();
}, []);

 

  const updateDoctorProfile = async () => {
  setLoading(prev => ({ ...prev, profile: true }));
  
  const { data, error } = await apiCall('/doctor/profile/update/', {
    method: 'PUT',
    body: JSON.stringify(doctorProfile)
  });
  
  if (data) {
    setDoctorProfile(prev => ({ ...prev, ...data }));
    setIsEditingProfile(false);
    alert('Profile updated successfully!');
  } else {
    alert(`Profile update failed: ${error}`);
  }
  
  setLoading(prev => ({ ...prev, profile: false }));
};

  const runAIAnalysis = async () => {
  if (!analysisForm.symptoms.trim()) {
    alert('Please enter symptoms to analyze');
    return;
  }

  setIsAnalyzing(true);
  setLoading(prev => ({ ...prev, analysis: true }));

  const symptomsArray = analysisForm.symptoms
    .split(',')
    .map(symptom => symptom.trim())
    .filter(symptom => symptom.length > 0);

  try {
    const requestData = {
      symptoms: symptomsArray
    };

    // Add patient_id if a patient is selected
    if (analysisForm.patientId) {
      requestData.patient_id = analysisForm.patientId;
    }

    const { data, error } = await apiCall('/predict/', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (data) {
      setAnalysisResult({
        predictions: data.top_predictions ? 
          data.top_predictions.map(pred => ({
            condition: pred.disease || pred.condition,
            probability: Math.round((pred.probability || pred.confidence) * 100)
          })) : 
          [{
            condition: data.predicted_disease,
            probability: Math.round(data.confidence * 100)
          }],
        confidence: data.confidence,
        matchedSymptoms: data.matched_symptoms || [],
        inputSymptoms: data.input_symptoms || symptomsArray,
        analysisDate: new Date().toLocaleString(),
        patientInfo: analysisForm.patientId ? 
          realPatients.find(p => p.id == analysisForm.patientId) : null
      });
      
      // Refresh statistics after new analysis
      fetchDoctorStatistics();
    } else {
      alert(`Analysis failed: ${error}`);
    }
  } catch (err) {
    console.error('Analysis error:', err);
    alert('Analysis failed. Please try again.');
  }

  setIsAnalyzing(false);
  setLoading(prev => ({ ...prev, analysis: false }));
};

  

  // Add this component inside your DoctorDashboard component
const RecentActivitySection = ({ darkMode }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setLoadingActivity(true);
    const { data } = await apiCall('/predictions/history/?limit=5');
    
    if (data && data.history) {
      const activities = data.history.map(prediction => ({
        id: prediction.id,
        action: `AI analysis completed`,
        patient: prediction.patient_name || 'Patient',
        time: new Date(prediction.created_at).toLocaleDateString(),
        type: 'analysis',
        prediction: prediction
      }));
      setRecentActivity(activities);
    }
    setLoadingActivity(false);
  };

  return (
    <div className={`lg:col-span-3 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    } rounded-xl shadow-lg border p-6`}>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2 text-purple-600" />
        Recent Activity
      </h2>
      
      {loadingActivity ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm">Loading activity...</p>
        </div>
      ) : recentActivity.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={activity.id} className={`flex items-center justify-between p-4 rounded-lg ${
              darkMode ? 'bg-slate-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'analysis' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {activity.type === 'analysis' ? <Brain className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Patient: {activity.patient}
                    {activity.prediction && (
                      <span className="ml-2">- {activity.prediction.predicted_disease}</span>
                    )}
                  </p>
                </div>
              </div>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

  // Filter patients based on search and status
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'recent') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return matchesSearch && new Date(patient.last_login) > lastWeek;
    }
    return matchesSearch;
  });

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white' 
        : 'bg-gradient-to-br from-purple-50 via-white to-purple-100 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`${
        darkMode 
          ? 'bg-gradient-to-r from-purple-800 to-indigo-900 border-purple-700 shadow-2xl' 
          : 'bg-gradient-to-r from-purple-600 to-indigo-700 border-purple-200 shadow-xl'
      } border-b transition-all duration-300 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Doctor Portal</h1>
                <p className="text-purple-100 text-xs">Dr. {user.first_name} {user.last_name}</p>
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
          <div className="flex space-x-2 flex-wrap">
            {[
              { id: 'quickActions', label: 'Dashboard', icon: TrendingUp },
              { id: 'patients', label: 'Patient Management', icon: Users },
              { id: 'analysis', label: 'AI Analysis', icon: Brain },
              { id: 'profile', label: 'My Profile', icon: User }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? (darkMode ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white')
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
        
        {/* Dashboard Tab */}
{activeTab === 'quickActions' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
    {/* Quick Stats Cards */}
    <div className={`${
      darkMode ? 'bg-gradient-to-br from-purple-800 to-indigo-800 text-white' : 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800'
    } p-6 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">Total Patients</p>
          <p className="text-3xl font-bold">{doctorStats.total_patients || realPatients.length}</p>
        </div>
        <Users className="h-12 w-12 opacity-80" />
      </div>
    </div>

    <div className={`${
      darkMode ? 'bg-gradient-to-br from-green-800 to-emerald-800 text-white' : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800'
    } p-6 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">Total Predictions</p>
          <p className="text-3xl font-bold">{doctorStats.total_predictions || 0}</p>
        </div>
        <FileText className="h-12 w-12 opacity-80" />
      </div>
    </div>

    <div className={`${
      darkMode ? 'bg-gradient-to-br from-blue-800 to-cyan-800 text-white' : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-800'
    } p-6 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">My Analyses</p>
          <p className="text-3xl font-bold">{doctorStats.doctor_analyses || 0}</p>
        </div>
        <Brain className="h-12 w-12 opacity-80" />
      </div>
    </div>

    {/* Recent Activity - Fetch real activity data */}
    <RecentActivitySection darkMode={darkMode} />
  </div>
)}



        // Patients Tab - Updated for your API structure
{activeTab === 'patients' && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    {/* Patient List */}
    <div className={`lg:col-span-1 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    } rounded-xl shadow-lg border p-6`}>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2 text-purple-600" />
        My Patients ({realPatients.length || patients.length})
      </h2>

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all ${
              darkMode 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500`}
          />
        </div>
      </div>

      {/* Patient List */}
      {loading.patients ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm">Loading patients...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {(realPatients.length > 0 ? realPatients : patients).map((patient) => (
            <div
              key={patient.id}
              onClick={() => fetchPatientDetails(patient.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-102 ${
                selectedPatient?.id === patient.id
                  ? (darkMode ? 'border-purple-600 bg-purple-900/20' : 'border-purple-500 bg-purple-50')
                  : (darkMode ? 'border-slate-600 hover:border-purple-600 bg-slate-700' : 'border-gray-200 hover:border-purple-300 bg-gray-50')
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{patient.first_name} {patient.last_name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {patient.email}
                  </p>
                  {patient.last_login && (
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Last active: {new Date(patient.last_login).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {patient.medical_records_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {patient.medical_records_count} records
                    </span>
                  )}
                  {patient.predictions_count > 0 && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {patient.predictions_count} analyses
                    </span>
                  )}
                  <Eye className="h-4 w-4 text-purple-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Patient Details */}
    <div className={`lg:col-span-2 ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    } rounded-xl shadow-lg border p-6`}>
      {loading.patient ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading patient details...</p>
        </div>
      ) : !selectedPatient ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="font-medium mb-2">Select a Patient</p>
          <p className="text-sm">Choose a patient from the list to view their details and medical history</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient Header */}
          <div className={`p-6 rounded-xl ${
            darkMode ? 'bg-gradient-to-r from-purple-800 to-indigo-800' : 'bg-gradient-to-r from-purple-100 to-indigo-100'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Email:</strong> {selectedPatient.email}</p>
                  <p><strong>Phone:</strong> {selectedPatient.phone || 'Not provided'}</p>
                  <p><strong>DOB:</strong> {selectedPatient.date_of_birth || 'Not provided'}</p>
                  <p><strong>Gender:</strong> {selectedPatient.gender || 'Not provided'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                  Patient ID: #{selectedPatient.id}
                </p>
                <p className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                  Joined: {new Date(selectedPatient.date_joined).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Medical Records 
                {selectedPatient.medical_records && (
                  <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded-full">
                    {selectedPatient.medical_records.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => fetchPatientDetails(selectedPatient.id)}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            
            {!selectedPatient.medical_records || selectedPatient.medical_records.length === 0 ? (
              <div className={`text-center py-8 ${
                darkMode ? 'bg-slate-700' : 'bg-gray-50'
              } rounded-xl`}>
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No medical records found</p>
                <p className="text-sm mt-2">Medical records will appear here when patients add them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPatient.medical_records.map((record) => (
                  <div key={record.id} className={`p-4 rounded-xl border ${
                    darkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold">Medical Record #{record.id}</h4>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold mb-1 flex items-center">
                          <Activity className="h-4 w-4 mr-1 text-red-500" />
                          Symptoms
                        </h5>
                        <div className={`text-sm p-2 rounded ${
                          darkMode ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          {record.symptoms ? (
                            <div className="flex flex-wrap gap-1">
                              {typeof record.symptoms === 'string' ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                  {record.symptoms}
                                </span>
                              ) : (
                                record.symptoms.map((symptom, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                    {symptom}
                                  </span>
                                ))
                              )}
                            </div>
                          ) : (
                            <p>No symptoms recorded</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-blue-500" />
                          Details
                        </h5>
                        <div className={`text-sm p-2 rounded ${
                          darkMode ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          <p><strong>Duration:</strong> {record.duration || 'Not specified'}</p>
                          <p><strong>Severity:</strong> {record.severity ? `${record.severity}/10` : 'Not specified'}</p>
                          {record.notes && (
                            <p><strong>Notes:</strong> {record.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {record.additional_notes && (
                      <div className="mt-3">
                        <h5 className="font-semibold mb-1 flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-green-500" />
                          Additional Notes
                        </h5>
                        <p className={`text-sm p-2 rounded ${
                          darkMode ? 'bg-slate-600' : 'bg-white'
                        }`}>
                          {record.additional_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Predictions History */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <Brain className="h-5 w-5 mr-2 text-green-600" />
                AI Analysis History
                {selectedPatient.predictions && (
                  <span className="ml-2 text-sm bg-green-500 text-white px-2 py-1 rounded-full">
                    {selectedPatient.predictions.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => fetchPatientDetails(selectedPatient.id)}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            
            {!selectedPatient.predictions || selectedPatient.predictions.length === 0 ? (
              <div className={`text-center py-8 ${
                darkMode ? 'bg-slate-700' : 'bg-gray-50'
              } rounded-xl`}>
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No AI predictions found</p>
                <p className="text-sm mt-2">AI analyses will appear here when they are performed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPatient.predictions.map((prediction) => (
                  <div key={prediction.id} className={`p-4 rounded-xl border ${
                    prediction.approved_by_doctor
                      ? (darkMode ? 'border-green-600 bg-green-900/20' : 'border-green-400 bg-green-50')
                      : (darkMode ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-400 bg-yellow-50')
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg">
                          {prediction.predicted_disease || prediction.disease_name}
                        </h4>
                        <p className="text-sm">
                          Confidence: {Math.round((prediction.confidence || prediction.probability) * 100)}%
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Analysis ID: #{prediction.id}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {prediction.approved_by_doctor ? (
                          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => approveAnalysis(prediction.id)}
                            className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600 transition-colors flex items-center"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                        )}
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(prediction.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Symptoms */}
                    <div className="mb-3">
                      <h5 className="font-semibold text-sm mb-2">Analyzed Symptoms:</h5>
                      <div className="flex flex-wrap gap-2">
                        {prediction.symptoms && prediction.symptoms.map((symptom, idx) => (
                          <span key={idx} className={`px-2 py-1 rounded text-xs ${
                            darkMode ? 'bg-slate-600 text-gray-300' : 'bg-white text-gray-700 border'
                          }`}>
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Status: {prediction.status || 'Completed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)}

        {/* AI Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-lg border p-6`}>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Brain className="h-6 w-6 mr-3 text-purple-600" />
                AI Disease Prediction
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Patient (Optional)
                  </label>
                  <select
                    value={analysisForm.patientId || ''}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, patientId: e.target.value || null }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                      darkMode 
                        ? 'bg-slate-700 border-purple-600 text-white focus:border-purple-400' 
                        : 'bg-purple-50 border-purple-300 text-gray-900 focus:border-purple-500'
                    }`}
                  >
                    <option value="">Select a patient (optional)</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Symptoms to Analyze *
                  </label>
                  <textarea
                    value={analysisForm.symptoms}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    rows={6}
                    placeholder="Enter symptoms separated by commas (e.g., fever, headache, cough, fatigue)..."
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                      darkMode 
                        ? 'bg-slate-700 border-purple-600 text-white placeholder-gray-400 focus:border-purple-400' 
                        : 'bg-purple-50 border-purple-300 text-gray-900 focus:border-purple-500'
                    } focus:ring-4 focus:ring-purple-200`}
                    required
                  />
                </div>

                <button
                  onClick={runAIAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-4 px-8 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 transition-all duration-200 flex items-center justify-center text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Running AI Analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-3" />
                      Run AI Analysis
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Analysis Results */}
            <div className={`${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-lg border p-6`}>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Analysis Results
              </h2>

              {!analysisResult && !isAnalyzing && (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">Ready for Analysis</p>
                  <p className="text-sm">Enter symptoms and run the AI analysis to get predictions</p>
                </div>
              )}

              {loading.analysis && (
                <div className="text-center py-12">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-lg font-bold mb-2">AI Processing...</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Analyzing symptoms with machine learning
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${
                    darkMode ? 'bg-gradient-to-r from-purple-800 to-indigo-800' : 'bg-gradient-to-r from-purple-100 to-indigo-100'
                  }`}>
                    <h3 className="font-bold text-lg">Analysis Complete</h3>
                    <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                      {analysisResult.analysisDate}
                    </p>
                    {analysisResult.patientInfo && (
                      <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                        Patient: {analysisResult.patientInfo.first_name} {analysisResult.patientInfo.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3 text-purple-600 dark:text-purple-400">
                      Predicted Conditions
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.predictions.map((prediction, index) => (
                        <div key={index} className={`p-4 rounded-xl border-2 ${
                          index === 0 
                            ? (darkMode ? 'border-green-600 bg-green-900/20' : 'border-green-400 bg-green-50')
                            : (darkMode ? 'border-purple-600 bg-slate-700' : 'border-purple-200 bg-purple-50')
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              {index === 0 && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
                              <span className="font-bold text-lg">{prediction.condition}</span>
                              {index === 0 && (
                                <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                  Most Likely
                                </span>
                              )}
                            </div>
                            <span className="text-xl font-bold text-purple-600">
                              {prediction.probability}%
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-3 rounded-full ${
                                index === 0 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                  : 'bg-gradient-to-r from-purple-500 to-indigo-600'
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
                          <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium ${
                            darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                          }`}>
                            ✓ {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`p-4 rounded-xl border-2 ${
                    darkMode ? 'bg-slate-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-orange-500" />
                      <div>
                        <p className="font-bold mb-1">Professional Disclaimer</p>
                        <p className="text-sm">This AI analysis is a diagnostic aid tool. Always use your clinical judgment and consider comprehensive patient evaluation before making treatment decisions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={`${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          } rounded-xl shadow-lg border p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <User className="h-6 w-6 mr-3 text-purple-600" />
                Doctor Profile
              </h2>
              <div className="flex space-x-2">
                {isEditingProfile && (
                  <button
                    onClick={updateDoctorProfile}
                    className="flex items-center px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                )}
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isEditingProfile
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {isEditingProfile ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {loading.profile ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
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
                      value={doctorProfile.first_name || user.first_name || ''}
                      onChange={(e) => setDoctorProfile(prev => ({ ...prev, first_name: e.target.value }))}
                      disabled={!isEditingProfile}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={doctorProfile.last_name || user.last_name || ''}
                      onChange={(e) => setDoctorProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      disabled={!isEditingProfile}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Specialization</label>
                    <input
                      type="text"
                      value={doctorProfile.specialization || ''}
                      onChange={(e) => setDoctorProfile(prev => ({ ...prev, specialization: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="e.g., Internal Medicine, Cardiology"
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">License Number</label>
                    <input
                      type="text"
                      value={doctorProfile.license_number || ''}
                      onChange={(e) => setDoctorProfile(prev => ({ ...prev, license_number: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Medical license number"
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Years of Experience</label>
                    <input
                      type="number"
                      value={doctorProfile.years_experience || ''}
                      onChange={(e) => setDoctorProfile(prev => ({ ...prev, years_experience: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Years in practice"
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={doctorProfile.email || user.email || ''}
                        onChange={(e) => setDoctorProfile(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditingProfile}
                        className={`w-full px-4 py-3 rounded-xl border transition-all ${
                          isEditingProfile
                            ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
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
                        value={doctorProfile.phone || ''}
                        onChange={(e) => setDoctorProfile(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditingProfile}
                        placeholder="Enter your phone number"
                        className={`w-full px-4 py-3 rounded-xl border transition-all ${
                          isEditingProfile
                            ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                        }`}
                      />
                      <Phone className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital/Clinic</label>
                    <input
                      type="text"
                      value={doctorProfile.hospital || ''}
                      onChange={(e) => setDoctorProfile(prev => ({ ...prev, hospital: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Hospital or clinic name"
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isEditingProfile
                          ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                          : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={doctorProfile.address || ''}
                        onChange={(e) => setDoctorProfile(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!isEditingProfile}
                        placeholder="Hospital/clinic address"
                        className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                          isEditingProfile
                            ? (darkMode ? 'bg-slate-700 border-purple-600 text-white' : 'bg-white border-purple-300')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500')
                        }`}
                      />
                      <MapPin className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;