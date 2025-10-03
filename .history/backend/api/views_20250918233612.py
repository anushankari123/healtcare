from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import PatientProfile, DoctorProfile, MedicalRecord, SymptomPrediction, UserProfile
from .serializers import (
    UserSerializer, PatientProfileSerializer, DoctorProfileSerializer, 
    MedicalRecordSerializer, PredictionSerializer, PredictionResponseSerializer,
    UserListSerializer, UserProfileSerializer
)
import os
from django.core.paginator import Paginator
from django.db.models import Q
from django.conf import settings
from api.ml_model import DiseasePredictor, COMMON_SYMPTOMS, train_model_if_needed

# Helper function to check if user is doctor
def is_doctor(user):
    try:
        return user.userprofile.user_type == 'doctor'
    except (AttributeError, UserProfile.DoesNotExist):
        return False

def is_patient(user):
    try:
        return user.userprofile.user_type == 'patient'
    except (AttributeError, UserProfile.DoesNotExist):
        return False

# AUTHENTICATION VIEWS
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        user_profile = UserProfile.objects.get(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user_profile.user_type
            }
        }, status=status.HTTP_201_CREATED)
    
    print("REGISTER ERRORS:", serializer.errors)  # 👈 add this
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username is None or password is None:
        return Response({'error': 'Please provide both username and password'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, 
                       status=status.HTTP_401_UNAUTHORIZED)
    
    token, created = Token.objects.get_or_create(user=user)
    user_profile = UserProfile.objects.get(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': user_profile.user_type
        }
    }, status=status.HTTP_200_OK)

# PATIENT PROFILE VIEWS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_profile(request):
    if not is_patient(request.user):
        return Response({'error': 'Access denied. Patients only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = PatientProfile.objects.get(user=request.user)
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_patient_profile(request):
    if not is_patient(request.user):
        return Response({'error': 'Access denied. Patients only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = PatientProfile.objects.get(user=request.user)
        serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

# DOCTOR PROFILE VIEWS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_doctor_profile(request):
    if not is_doctor(request.user):
        return Response({'error': 'Access denied. Doctors only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = DoctorProfile.objects.get(user=request.user)
        serializer = DoctorProfileSerializer(profile)
        return Response(serializer.data)
    except DoctorProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_doctor_profile(request):
    if not is_doctor(request.user):
        return Response({'error': 'Access denied. Doctors only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = DoctorProfile.objects.get(user=request.user)
        serializer = DoctorProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except DoctorProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

# MEDICAL RECORDS VIEWS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medical_records(request):
    if is_patient(request.user):
        # Patients can only see their own records
        try:
            profile = PatientProfile.objects.get(user=request.user)
            records = MedicalRecord.objects.filter(patient=profile).order_by('-created_at')
            serializer = MedicalRecordSerializer(records, many=True)
            return Response(serializer.data)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif is_doctor(request.user):
        # Doctors can see all records or filter by patient
        patient_id = request.GET.get('patient_id')
        if patient_id:
            records = MedicalRecord.objects.filter(patient_id=patient_id).order_by('-created_at')
        else:
            records = MedicalRecord.objects.all().order_by('-created_at')[:50]  # Last 50 records
        
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)
    
    else:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_medical_record(request):
    if not is_patient(request.user):
        return Response({'error': 'Access denied. Patients only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        patient_profile = PatientProfile.objects.get(user=request.user)
        
        data = request.data.copy()
        data['patient'] = patient_profile.id
        
        serializer = MedicalRecordSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except PatientProfile.DoesNotExist:
        return Response(
            {'error': 'Patient profile does not exist'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# DOCTOR-SPECIFIC VIEWS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_patients(request):
    if not is_doctor(request.user):
        return Response({'error': 'Access denied. Doctors only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Get query parameters
    search = request.GET.get('search', '').strip()
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    
    # Validate page_size
    page_size = min(max(page_size, 1), 100)
    
    # Get all patients
    patients = User.objects.filter(userprofile__user_type='patient').order_by('date_joined')
    
    # Apply search filter
    if search:
        patients = patients.filter(
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search)
        )
    
    # Apply pagination
    paginator = Paginator(patients, page_size)
    try:
        patients_page = paginator.page(page)
    except:
        return Response({
            'error': 'Invalid page number',
            'total_pages': paginator.num_pages
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Serialize patient data
    patients_data = []
    for patient in patients_page.object_list:
        # Get patient profile
        profile_data = None
        try:
            profile = PatientProfile.objects.get(user=patient)
            profile_data = PatientProfileSerializer(profile).data
        except PatientProfile.DoesNotExist:
            pass
        
        # Get medical records count
        medical_records_count = MedicalRecord.objects.filter(patient__user=patient).count()
        predictions_count = SymptomPrediction.objects.filter(medical_record__patient__user=patient).count()
        
        patient_data = {
            'id': patient.id,
            'username': patient.username,
            'email': patient.email,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'date_joined': patient.date_joined,
            'last_login': patient.last_login,
            'profile': profile_data,
            'statistics': {
                'medical_records_count': medical_records_count,
                'predictions_count': predictions_count
            }
        }
        patients_data.append(patient_data)
    
    return Response({
        'patients': patients_data,
        'pagination': {
            'current_page': page,
            'total_pages': paginator.num_pages,
            'total_patients': paginator.count,
            'page_size': page_size,
            'has_next': patients_page.has_next(),
            'has_previous': patients_page.has_previous()
        },
        'search': search
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_by_id(request, patient_id):
    if not is_doctor(request.user):
        return Response({'error': 'Access denied. Doctors only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        patient = User.objects.get(id=patient_id, userprofile__user_type='patient')
    except User.DoesNotExist:
        return Response({
            'error': 'Patient not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get patient's profile and medical records
    try:
        profile = PatientProfile.objects.get(user=patient)
        profile_data = PatientProfileSerializer(profile).data
        
        # Get recent medical records
        medical_records = MedicalRecord.objects.filter(patient=profile).order_by('-created_at')[:10]
        records_data = MedicalRecordSerializer(medical_records, many=True).data
        
        patient_data = {
            'id': patient.id,
            'username': patient.username,
            'email': patient.email,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'date_joined': patient.date_joined,
            'last_login': patient.last_login,
            'profile': profile_data,
            'recent_records': records_data,
            'statistics': {
                'total_records': MedicalRecord.objects.filter(patient=profile).count(),
                'total_predictions': SymptomPrediction.objects.filter(medical_record__patient=profile).count()
            }
        }
        
        return Response(patient_data, status=status.HTTP_200_OK)
        
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=status.HTTP_404_NOT_FOUND)

# AI PREDICTION VIEWS (Updated for doctor access)
BASE_DIR = getattr(settings, 'BASE_DIR', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, 'disease_model.joblib')
DATASET_PATH = os.path.join(BASE_DIR, 'Training.csv')

if not os.path.exists(DATASET_PATH):
    DATASET_PATH = r'D:\1c\backend\Training.csv'

predictor = None

def get_predictor():
    global predictor
    if predictor is None:
        predictor = train_model_if_needed(DATASET_PATH, MODEL_PATH)
        if predictor is None:
            print("Failed to initialize predictor")
    return predictor

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_disease(request):
    """Predict disease - accessible by both patients and doctors"""
    
    serializer = PredictionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    symptoms = serializer.validated_data['symptoms']
    
    # Get predictor instance
    current_predictor = get_predictor()
    if current_predictor is None:
        return Response({
            'error': 'Disease prediction model is not available. Please check if the training dataset exists.',
            'details': f'Looking for dataset at: {DATASET_PATH}'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        # Get prediction result from AI
        result = current_predictor.predict_disease(symptoms)
        if result.get('error'):
            return Response({
                'error': result['error'],
                'details': result.get('available_symptoms', [])
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare response data
        response_data = {
            'predicted_disease': result['predicted_disease'],
            'confidence': result['confidence'],
            'matched_symptoms': result.get('matched_symptoms', []),
            'top_predictions': result.get('top_3_predictions', []),
            'input_symptoms': symptoms
        }
        
        # Save prediction to database
        try:
            if is_patient(request.user):
                # Patient creating their own record
                patient_profile = PatientProfile.objects.get(user=request.user)
                doctor_profile = None
            elif is_doctor(request.user):
                # Doctor analyzing for a specific patient
                patient_id = request.data.get('patient_id')
                if not patient_id:
                    return Response({'error': 'patient_id is required for doctor analysis'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    patient_user = User.objects.get(id=patient_id, userprofile__user_type='patient')
                    patient_profile = PatientProfile.objects.get(user=patient_user)
                    doctor_profile = DoctorProfile.objects.get(user=request.user)
                except (User.DoesNotExist, PatientProfile.DoesNotExist, DoctorProfile.DoesNotExist):
                    return Response({'error': 'Patient or doctor profile not found'}, 
                                   status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Create a MedicalRecord for this prediction
            record = MedicalRecord.objects.create(
                patient=patient_profile,
                doctor=doctor_profile,
                symptoms=', '.join(symptoms),
                duration=request.data.get('duration', ''),
                severity=request.data.get('severity', ''),
                previous_conditions=request.data.get('previous_conditions', ''),
                current_medications=request.data.get('current_medications', ''),
                allergies=request.data.get('allergies', ''),
                is_analyzed_by_doctor=is_doctor(request.user)
            )
            
            # Create the SymptomPrediction linked to the MedicalRecord
            SymptomPrediction.objects.create(
                medical_record=record,
                predicted_condition=result['predicted_disease'],
                confidence_score=result['confidence'],
                predicted_severity='mild',  # adjust if AI returns severity
                recommendations='Follow medical advice',
                analyzed_by_doctor=doctor_profile if is_doctor(request.user) else None,
                doctor_approved=False
            )
            
        except Exception as save_error:
            print(f"Failed to save prediction: {save_error}")
            # Do not fail the API if saving fails
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return Response({
            'error': 'An error occurred during prediction',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_prediction(request, prediction_id):
    """Doctor approves/modifies a prediction"""
    if not is_doctor(request.user):
        return Response({'error': 'Access denied. Doctors only.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        prediction = SymptomPrediction.objects.get(id=prediction_id)
        doctor_profile = DoctorProfile.objects.get(user=request.user)
        
        prediction.doctor_approved = request.data.get('approved', True)
        prediction.doctor_comments = request.data.get('comments', '')
        prediction.analyzed_by_doctor = doctor_profile
        
        # Update medical record if doctor adds notes
        if request.data.get('doctor_notes'):
            prediction.medical_record.doctor_notes = request.data.get('doctor_notes')
            prediction.medical_record.save()
        
        prediction.save()
        
        return Response({
            'message': 'Prediction updated successfully',
            'approved': prediction.doctor_approved,
            'comments': prediction.doctor_comments
        }, status=status.HTTP_200_OK)
        
    except (SymptomPrediction.DoesNotExist, DoctorProfile.DoesNotExist):
        return Response({'error': 'Prediction or doctor profile not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

# COMMON SYMPTOM AND DISEASE VIEWS (accessible by both user types)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_common_symptoms(request):
    """Get list of common symptoms for frontend"""
    current_predictor = get_predictor()
    
    if current_predictor and current_predictor.symptoms_list:
        symptoms = sorted(current_predictor.symptoms_list)
        return Response({
            'symptoms': symptoms,
            'count': len(symptoms),
            'message': 'Symptoms from trained model'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'symptoms': COMMON_SYMPTOMS,
            'count': len(COMMON_SYMPTOMS),
            'message': 'Fallback common symptoms (model not available)'
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_symptom_suggestions(request):
    """Get symptom suggestions based on partial input"""
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response({'suggestions': []}, status=status.HTTP_200_OK)
    
    current_predictor = get_predictor()
    
    if current_predictor:
        suggestions = current_predictor.get_symptom_suggestions(query)
        return Response({
            'suggestions': suggestions,
            'query': query
        }, status=status.HTTP_200_OK)
    else:
        suggestions = [s for s in COMMON_SYMPTOMS if query.lower() in s.lower()][:10]
        return Response({
            'suggestions': suggestions,
            'query': query,
            'message': 'Using fallback symptoms'
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_diseases(request):
    """Get list of diseases that the model can predict"""
    current_predictor = get_predictor()
    
    if current_predictor and current_predictor.diseases_list:
        return Response({
            'diseases': sorted(current_predictor.diseases_list),
            'count': len(current_predictor.diseases_list)
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Disease prediction model is not available',
            'diseases': [],
            'count': 0
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prediction_history(request):
    """Get prediction history based on user type"""
    if is_patient(request.user):
        # Patients see only their own history
        try:
            patient_profile = PatientProfile.objects.get(user=request.user)
            predictions = SymptomPrediction.objects.filter(
                medical_record__patient=patient_profile
            ).order_by('-created_at')[:20]
            
            history = []
            for prediction in predictions:
                history.append({
                    'id': prediction.id,
                    'symptoms': prediction.medical_record.symptoms.split(', ') if prediction.medical_record.symptoms else [],
                    'predicted_disease': prediction.predicted_condition,
                    'confidence': prediction.confidence_score,
                    'doctor_approved': prediction.doctor_approved,
                    'doctor_comments': prediction.doctor_comments,
                    'created_at': prediction.created_at
                })
            
            return Response({
                'history': history,
                'count': len(history)
            }, status=status.HTTP_200_OK)
            
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif is_doctor(request.user):
        # Doctors see all predictions or filter by patient
        patient_id = request.GET.get('patient_id')
        if patient_id:
            predictions = SymptomPrediction.objects.filter(
                medical_record__patient__user_id=patient_id
            ).order_by('-created_at')[:20]
        else:
            predictions = SymptomPrediction.objects.all().order_by('-created_at')[:50]
        
        history = []
        for prediction in predictions:
            history.append({
                'id': prediction.id,
                'patient_name': f"{prediction.medical_record.patient.user.first_name} {prediction.medical_record.patient.user.last_name}",
                'patient_id': prediction.medical_record.patient.user.id,
                'symptoms': prediction.medical_record.symptoms.split(', ') if prediction.medical_record.symptoms else [],
                'predicted_disease': prediction.predicted_condition,
                'confidence': prediction.confidence_score,
                'doctor_approved': prediction.doctor_approved,
                'doctor_comments': prediction.doctor_comments,
                'created_at': prediction.created_at
            })
        
        return Response({
            'history': history,
            'count': len(history)
        }, status=status.HTTP_200_OK)
    
    else:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

# STATISTICS VIEWS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_statistics(request):
    """Get statistics based on user type"""
    from django.utils import timezone
    from datetime import timedelta
    
    if is_doctor(request.user):
        # Doctor statistics
        total_patients = User.objects.filter(userprofile__user_type='patient').count()
        total_predictions = SymptomPrediction.objects.count()
        
        # Recent activity (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_predictions = SymptomPrediction.objects.filter(created_at__gte=seven_days_ago).count()
        
        # Doctor's own analysis count
        doctor_profile = DoctorProfile.objects.get(user=request.user)
        doctor_analyses = SymptomPrediction.objects.filter(analyzed_by_doctor=doctor_profile).count()
        
        statistics = {
            'total_patients': total_patients,
            'total_predictions': total_predictions,
            'recent_predictions': recent_predictions,
            'doctor_analyses': doctor_analyses,
        }
        
    elif is_patient(request.user):
        # Patient statistics
        try:
            patient_profile = PatientProfile.objects.get(user=request.user)
            patient_records = MedicalRecord.objects.filter(patient=patient_profile).count()
            patient_predictions = SymptomPrediction.objects.filter(medical_record__patient=patient_profile).count()
            approved_predictions = SymptomPrediction.objects.filter(
                medical_record__patient=patient_profile,
                doctor_approved=True
            ).count()
            
            statistics = {
                'total_records': patient_records,
                'total_predictions': patient_predictions,
                'approved_predictions': approved_predictions,
                'approval_rate': round((approved_predictions / patient_predictions * 100), 2) if patient_predictions > 0 else 0
            }
            
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    else:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response(statistics, status=status.HTTP_200_OK)