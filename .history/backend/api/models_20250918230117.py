from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

class UserProfile(models.Model):
    USER_TYPE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='patient')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.user_type}"

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
    blood_type = models.CharField(max_length=5, blank=True)
    height = models.FloatField(null=True, blank=True, help_text="Height in cm")
    weight = models.FloatField(null=True, blank=True, help_text="Weight in kg")

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def age(self):
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None

    @property
    def bmi(self):
        if self.height and self.weight:
            height_m = self.height / 100
            return round(self.weight / (height_m ** 2), 1)
        return None

class DoctorProfile(models.Model):
    SPECIALIZATION_CHOICES = [
        ('general', 'General Practice'),
        ('cardiology', 'Cardiology'),
        ('dermatology', 'Dermatology'),
        ('endocrinology', 'Endocrinology'),
        ('gastroenterology', 'Gastroenterology'),
        ('neurology', 'Neurology'),
        ('oncology', 'Oncology'),
        ('orthopedics', 'Orthopedics'),
        ('pediatrics', 'Pediatrics'),
        ('psychiatry', 'Psychiatry'),
        ('pulmonology', 'Pulmonology'),
        ('radiology', 'Radiology'),
        ('urology', 'Urology'),
        ('other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    license_number = models.CharField(max_length=50, unique=True)
    specialization = models.CharField(max_length=20, choices=SPECIALIZATION_CHOICES, default='general')
    years_of_experience = models.PositiveIntegerField(default=0)
    hospital_affiliation = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name} - {self.get_specialization_display()}"

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
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.SET_NULL, null=True, blank=True)
    symptoms = models.TextField()
    duration = models.CharField(max_length=50, blank=True)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, blank=True)
    previous_conditions = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    doctor_notes = models.TextField(blank=True)
    is_analyzed_by_doctor = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Record for {self.patient} on {self.created_at.date()}"

class SymptomPrediction(models.Model):
    medical_record = models.OneToOneField(MedicalRecord, on_delete=models.CASCADE)
    predicted_condition = models.CharField(max_length=100)
    confidence_score = models.FloatField()
    predicted_severity = models.CharField(max_length=10, choices=MedicalRecord.SEVERITY_CHOICES)
    recommendations = models.TextField()
    analyzed_by_doctor = models.ForeignKey(DoctorProfile, on_delete=models.SET_NULL, null=True, blank=True)
    doctor_approved = models.BooleanField(default=False)
    doctor_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Prediction for {self.medical_record.patient} - {self.predicted_condition}"

@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance=None, created=False, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_patient_profile(sender, instance=None, created=False, **kwargs):
    if created:
        # Only create PatientProfile if user_type is patient (default)
        user_profile = UserProfile.objects.get(user=instance)
        if user_profile.user_type == 'patient':
            PatientProfile.objects.create(user=instance)