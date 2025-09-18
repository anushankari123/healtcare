from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

class PatientProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

class MedicalRecord(models.Model):
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]
    
    SEVERITY_MAP = {
        '1': 'mild',
        '2': 'mild', 
        '3': 'mild',
        '4': 'moderate',
        '5': 'moderate',
        '6': 'moderate',
        '7': 'severe',
        '8': 'severe',
        '9': 'severe',
        '10': 'severe'
    }
    
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    symptoms = models.TextField()
    duration = models.CharField(max_length=50, blank=True)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, blank=True)
    previous_conditions = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Record for {self.patient} on {self.created_at}"

class SymptomPrediction(models.Model):
    medical_record = models.OneToOneField(MedicalRecord, on_delete=models.CASCADE)
    predicted_condition = models.CharField(max_length=100)
    confidence_score = models.FloatField()
    predicted_severity = models.CharField(max_length=10, choices=MedicalRecord.SEVERITY_CHOICES)
    recommendations = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction for {self.medical_record.patient} - {self.predicted_condition}"

@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_patient_profile(sender, instance=None, created=False, **kwargs):
    if created:
        PatientProfile.objects.create(user=instance)