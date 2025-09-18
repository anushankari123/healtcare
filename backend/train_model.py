#!/usr/bin/env python3
"""
Script to train the disease prediction model
Run this script to train and save the model before starting the Django server
"""

import os
import sys
from api.ml_model import DiseasePredictor

def main():
    # Update these paths according to your setup
    DATASET_PATH = r'D:\1c\backend\Training.csv'  # Path to your training dataset
    MODEL_PATH = r'D:\1c\backend\disease_model.joblib'  # Path where model will be saved
    
    print("Disease Prediction Model Training Script")
    print("=" * 50)
    
    # Check if dataset exists
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset file not found at {DATASET_PATH}")
        print("Please ensure the Training.csv file exists at the specified path")
        return False
    
    # Initialize predictor
    predictor = DiseasePredictor()
    
    print(f"Dataset path: {DATASET_PATH}")
    print(f"Model will be saved to: {MODEL_PATH}")
    print("\nStarting training process...")
    
    # Train the model
    success = predictor.train_model(DATASET_PATH)
    
    if success:
        print("\nTraining completed successfully!")
        
        # Save the model
        save_success = predictor.save_model(MODEL_PATH)
        if save_success:
            print(f"Model saved successfully to {MODEL_PATH}")
            
            # Test the model with sample symptoms
            print("\n" + "="*50)
            print("Testing the trained model...")
            test_symptoms = ['itching', 'skin_rash', 'nodal_skin_eruptions']
            print(f"Test symptoms: {test_symptoms}")
            
            result = predictor.predict_disease(test_symptoms)
            if result.get('error'):
                print(f"Test prediction error: {result['error']}")
            else:
                print(f"Predicted disease: {result['predicted_disease']}")
                print(f"Confidence: {result['confidence']:.4f}")
                print(f"Matched symptoms: {result.get('matched_symptoms', [])}")
                
                if 'top_3_predictions' in result:
                    print("\nTop 3 predictions:")
                    for i, pred in enumerate(result['top_3_predictions'], 1):
                        print(f"  {i}. {pred['disease']}: {pred['probability']:.4f}")
            
            print("\n" + "="*50)
            print("Model training and testing completed!")
            print("You can now start your Django server.")
            return True
        else:
            print("Failed to save the model")
            return False
    else:
        print("Training failed!")
        return False

def test_existing_model():
    """Test an existing model"""
    MODEL_PATH = r'D:\1c\backend\disease_model.joblib'
    
    if not os.path.exists(MODEL_PATH):
        print(f"No existing model found at {MODEL_PATH}")
        return False
    
    predictor = DiseasePredictor()
    success = predictor.load_model(MODEL_PATH)
    
    if success:
        print("Model loaded successfully!")
        print(f"Available diseases: {len(predictor.diseases_list)}")
        print(f"Available symptoms: {len(predictor.symptoms_list)}")
        
        # Test prediction
        test_symptoms = ['high_fever', 'headache', 'vomiting']
        print(f"\nTesting with symptoms: {test_symptoms}")
        
        result = predictor.predict_disease(test_symptoms)
        if result.get('error'):
            print(f"Error: {result['error']}")
        else:
            print(f"Predicted disease: {result['predicted_disease']}")
            print(f"Confidence: {result['confidence']:.4f}")
        
        return True
    else:
        print("Failed to load model")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_existing_model()
    else:
        main()