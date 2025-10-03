from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PatientProfile, MedicalRecord, SymptomPrediction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        return user

class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PatientProfile
        fields = '__all__'

class SymptomPredictionSerializer(serializers.ModelSerializer):
    symptoms_list = serializers.SerializerMethodField()
    
    class Meta:
        model = SymptomPrediction
        fields = '__all__'
    
    def get_symptoms_list(self, obj):
        """Convert comma-separated symptoms string to list"""
        if obj.symptoms:
            return [symptom.strip() for symptom in obj.symptoms.split(',')]
        return []

class MedicalRecordSerializer(serializers.ModelSerializer):
    prediction = SymptomPredictionSerializer(source='symptomprediction', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ('patient', 'created_at')
    
    def to_internal_value(self, data):
        # Convert numeric severity to string before validation
        if 'severity' in data and data['severity']:
            severity_map = {
                '1': 'mild', '2': 'mild', '3': 'mild',
                '4': 'moderate', '5': 'moderate', '6': 'moderate',
                '7': 'severe', '8': 'severe', '9': 'severe', '10': 'severe'
            }
            if str(data['severity']) in severity_map:
                data = data.copy()
                data['severity'] = severity_map[str(data['severity'])]
        
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        # Automatically set the patient from the request user
        patient_profile = PatientProfile.objects.get(user=self.context['request'].user)
        validated_data['patient'] = patient_profile
        return super().create(validated_data)

class PredictionSerializer(serializers.Serializer):
    symptoms = serializers.ListField(
        child=serializers.CharField(max_length=100),
        help_text="List of symptoms for prediction",
        min_length=1
    )
    
    def validate_symptoms(self, value):
        """Validate symptoms list"""
        if not value:
            raise serializers.ValidationError("At least one symptom is required")
        
        # Clean up symptoms (remove extra spaces, convert underscores)
        cleaned_symptoms = []
        for symptom in value:
            cleaned = symptom.strip().lower().replace(' ', '_')
            if cleaned:
                cleaned_symptoms.append(cleaned)
        
        if not cleaned_symptoms:
            raise serializers.ValidationError("No valid symptoms provided")
        
        return cleaned_symptoms

class PredictionResponseSerializer(serializers.Serializer):
    predicted_disease = serializers.CharField()
    confidence = serializers.FloatField()
    matched_symptoms = serializers.ListField(child=serializers.CharField())
    top_predictions = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    input_symptoms = serializers.ListField(child=serializers.CharField())

class SymptomSuggestionSerializer(serializers.Serializer):
    suggestions = serializers.ListField(child=serializers.CharField())
    query = serializers.CharField()

class DiseaseListSerializer(serializers.Serializer):
    diseases = serializers.ListField(child=serializers.CharField())
    count = serializers.IntegerField()

class PredictionHistorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    symptoms = serializers.ListField(child=serializers.CharField())
    predicted_disease = serializers.CharField()
    confidence = serializers.FloatField()
    created_at = serializers.DateTimeField()