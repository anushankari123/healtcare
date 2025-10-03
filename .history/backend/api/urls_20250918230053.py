from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    
    # Patient profile endpoints
    path('patient/profile/', views.get_patient_profile, name='get_patient_profile'),
    path('patient/profile/update/', views.update_patient_profile, name='update_patient_profile'),
    
    # Doctor profile endpoints
    path('doctor/profile/', views.get_doctor_profile, name='get_doctor_profile'),
    path('doctor/profile/update/', views.update_doctor_profile, name='update_doctor_profile'),
    
    # Medical records endpoints
    path('medical-records/', views.get_medical_records, name='get_medical_records'),
    path('medical-records/create/', views.create_medical_record, name='create_medical_record'),
    
    # Doctor-specific endpoints
    path('doctor/patients/', views.get_all_patients, name='get_all_patients'),
    path('doctor/patients/<int:patient_id>/', views.get_patient_by_id, name='get_patient_by_id'),
    path('doctor/predictions/<int:prediction_id>/approve/', views.approve_prediction, name='approve_prediction'),
    
    # Disease prediction endpoints (accessible by both)
    path('predict/', views.predict_disease, name='predict_disease'),
    path('symptoms/', views.get_common_symptoms, name='get_common_symptoms'),
    path('symptoms/suggestions/', views.get_symptom_suggestions, name='get_symptom_suggestions'),
    path('diseases/', views.get_available_diseases, name='get_available_diseases'),
    path('predictions/history/', views.get_prediction_history, name='get_prediction_history'),
    
    # Statistics endpoints
    path('statistics/', views.get_user_statistics, name='get_user_statistics'),
]