from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import PatientProfile, MedicalRecord, SymptomPrediction
from .serializers import (
    UserSerializer, PatientProfileSerializer, MedicalRecordSerializer, 
    PredictionSerializer, PredictionResponseSerializer
)
import os
from django.core.paginator import Paginator
from django.db.models import Q
from django.conf import settings
from api.ml_model import DiseasePredictor, COMMON_SYMPTOMS, train_model_if_needed

# Authentication views (unchanged)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)
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
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
    }, status=status.HTTP_200_OK)

# Profile views (unchanged)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_profile(request):
    try:
        profile = PatientProfile.objects.get(user=request.user)
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_patient_profile(request):
    try:
        profile = PatientProfile.objects.get(user=request.user)
        serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

# Medical records views (unchanged)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medical_records(request):
    try:
        profile = PatientProfile.objects.get(user=request.user)
        records = MedicalRecord.objects.filter(patient=profile).order_by('-created_at')
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_medical_record(request):
    print("Request data:", request.data)
    print("User:", request.user)
    
    try:
        patient_profile = PatientProfile.objects.get(user=request.user)
        print("Patient profile:", patient_profile)
        
        data = request.data.copy()
        data['patient'] = patient_profile.id
        
        # Pass the request in context
        serializer = MedicalRecordSerializer(data=data, context={'request': request})
        print("Serializer data:", serializer.initial_data)
        
        if serializer.is_valid():
            print("Serializer is valid")
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except PatientProfile.DoesNotExist:
        print("Patient profile does not exist")
        return Response(
            {'error': 'Patient profile does not exist'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print("Unexpected error:", str(e))
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Initialize predictor with better path handling
BASE_DIR = getattr(settings, 'BASE_DIR', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, 'disease_model.joblib')
DATASET_PATH = os.path.join(BASE_DIR, 'Training.csv')

# Alternative paths if not found in BASE_DIR
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = r'D:\1c\backend\Training.csv'  # Your original path as fallback

print(f"Looking for dataset at: {DATASET_PATH}")
print(f"Model will be saved/loaded from: {MODEL_PATH}")

# Global predictor instance
predictor = None

def get_predictor():
    """Get or initialize the predictor"""
    global predictor
    if predictor is None:
        predictor = train_model_if_needed(DATASET_PATH, MODEL_PATH)
        if predictor is None:
            print("Failed to initialize predictor")
    return predictor

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_disease(request):
    """Predict disease based on symptoms and save to user's history"""
    
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
            patient_profile = PatientProfile.objects.get(user=request.user)
            
            # Create a MedicalRecord for this prediction
            record = MedicalRecord.objects.create(
                patient=patient_profile,
                symptoms=', '.join(symptoms),
                duration='',
                severity='',  # or map from AI if available
                previous_conditions='',
                current_medications='',
                allergies=''
            )
            
            # Create the SymptomPrediction linked to the MedicalRecord
            SymptomPrediction.objects.create(
                medical_record=record,
                predicted_condition=result['predicted_disease'],
                confidence_score=result['confidence'],
                predicted_severity='mild',  # adjust if AI returns severity
                recommendations='Follow medical advice'  # optional, can come from AI
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_common_symptoms(request):
    """Get list of common symptoms for frontend"""
    current_predictor = get_predictor()
    
    if current_predictor and current_predictor.symptoms_list:
        # Return actual symptoms from the trained model
        symptoms = sorted(current_predictor.symptoms_list)
        return Response({
            'symptoms': symptoms,
            'count': len(symptoms),
            'message': 'Symptoms from trained model'
        }, status=status.HTTP_200_OK)
    else:
        # Fallback to predefined common symptoms
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
        # Fallback to basic search in common symptoms
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
    """Get user's prediction history"""
    try:
        patient_profile = PatientProfile.objects.get(user=request.user)
        predictions = SymptomPrediction.objects.filter(
            medical_record__patient=patient_profile
        ).order_by('-created_at')[:20]  # Last 20 predictions
        
        history = []
        for prediction in predictions:
            history.append({
                'id': prediction.id,
                'symptoms': prediction.medical_record.symptoms.split(', ') if prediction.medical_record.symptoms else [],
                'predicted_disease': prediction.predicted_condition,
                'confidence': prediction.confidence_score,
                'created_at': prediction.created_at
            })
        
        return Response({
            'history': history,
            'count': len(history)
        }, status=status.HTTP_200_OK)
        
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
