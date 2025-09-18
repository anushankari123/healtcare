from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    
    # Profile endpoints
    path('profile/', views.get_patient_profile, name='get_profile'),
    path('profile/update/', views.update_patient_profile, name='update_profile'),
    
    # Medical records endpoints
    path('medical-records/', views.get_medical_records, name='get_medical_records'),
    path('medical-records/create/', views.create_medical_record, name='create_medical_record'),
    
    # Disease prediction endpoints
    path('predict/', views.predict_disease, name='predict_disease'),
    path('symptoms/', views.get_common_symptoms, name='get_common_symptoms'),
    path('symptoms/suggestions/', views.get_symptom_suggestions, name='get_symptom_suggestions'),
    path('diseases/', views.get_available_diseases, name='get_available_diseases'),
    path('predictions/history/', views.get_prediction_history, name='get_prediction_history'),
]