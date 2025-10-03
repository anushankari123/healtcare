from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PatientProfile, DoctorProfile, MedicalRecord, SymptomPrediction, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['user_type', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True, default='patient')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'user_type']

    def create(self, validated_data):
        user_type = validated_data.pop('user_type', 'patient')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Update user profile with the specified type
        user_profile = UserProfile.objects.get(user=user)
        user_profile.user_type = user_type
        user_profile.save()
        
        # Create specific profile based on user type
        if user_type == 'patient':
            PatientProfile.objects.create(user=user)
        elif user_type == 'doctor':
            DoctorProfile.objects.create(
                user=user,
                license_number=f"TEMP_{user.id}",  # Temporary, should be updated
            )
        
        return user

class PatientProfileSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()
    
    class Meta:
        model = PatientProfile
        fields = ['date_of_birth', 'gender', 'phone', 'address', 'emergency_contact', 
                 'blood_type', 'height', 'weight', 'age', 'bmi']

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['license_number', 'specialization', 'years_of_experience', 
                 'hospital_affiliation', 'phone', 'is_verified']

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'doctor', 'symptoms', 'duration', 'severity', 
                 'previous_conditions', 'current_medications', 'allergies', 
                 'doctor_notes', 'is_analyzed_by_doctor', 'created_at', 'updated_at',
                 'patient_name', 'doctor_name']
        read_only_fields = ['created_at', 'updated_at', 'patient_name', 'doctor_name']

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"
        return None

class SymptomPredictionSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SymptomPrediction
        fields = ['id', 'medical_record', 'predicted_condition', 'confidence_score', 
                 'predicted_severity', 'recommendations', 'analyzed_by_doctor', 
                 'doctor_approved', 'doctor_comments', 'created_at', 'updated_at',
                 'patient_name', 'doctor_name']
        read_only_fields = ['created_at', 'updated_at', 'patient_name', 'doctor_name']

    def get_patient_name(self, obj):
        return f"{obj.medical_record.patient.user.first_name} {obj.medical_record.patient.user.last_name}"

    def get_doctor_name(self, obj):
        if obj.analyzed_by_doctor:
            return f"Dr. {obj.analyzed_by_doctor.user.first_name} {obj.analyzed_by_doctor.user.last_name}"
        return None

class PredictionSerializer(serializers.Serializer):
    symptoms = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=1
    )

class PredictionResponseSerializer(serializers.Serializer):
    predicted_disease = serializers.CharField()
    confidence = serializers.FloatField()
    matched_symptoms = serializers.ListField(child=serializers.CharField())
    top_predictions = serializers.ListField(child=serializers.DictField())
    input_symptoms = serializers.ListField(child=serializers.CharField())

class UserListSerializer(serializers.ModelSerializer):
    user_type = serializers.CharField(source='userprofile.user_type', read_only=True)
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'date_joined', 'last_login', 'is_active', 'is_staff', 
                 'user_type', 'profile']

    def get_profile(self, obj):
        if hasattr(obj, 'userprofile'):
            if obj.userprofile.user_type == 'patient' and hasattr(obj, 'patientprofile'):
                return PatientProfileSerializer(obj.patientprofile).data
            elif obj.userprofile.user_type == 'doctor' and hasattr(obj, 'doctorprofile'):
                return DoctorProfileSerializer(obj.doctorprofile).data
        return None