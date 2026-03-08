import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

print("⏳ Loading AI Model...")
# 👇 Ensure this is your correct model name!
model = tf.keras.models.load_model('mission_model.h5') 

print("📁 Loading Test Dataset...")
# 👇 Using the correct path you established
test_dir = '../dataset/mission_dataset' 

test_datagen = ImageDataGenerator(rescale=1./255)
test_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=(224, 224), 
    batch_size=32,
    class_mode='categorical', # 👈 FIXED: Changed to multi-class
    shuffle=False
)

print("🤖 Running Predictions (This may take a minute)...")
Y_pred = model.predict(test_generator)
y_pred_classes = np.argmax(Y_pred, axis=1) # 👈 FIXED: Grabs the top prediction per image
y_true = test_generator.classes

print("\n" + "="*50)
print("🏆 CAPSTONE AI PERFORMANCE METRICS 🏆")
print("="*50)

# 👈 FIXED: Added average='weighted' to handle all 10 classes correctly
accuracy = accuracy_score(y_true, y_pred_classes)
precision = precision_score(y_true, y_pred_classes, average='weighted', zero_division=0)
recall = recall_score(y_true, y_pred_classes, average='weighted', zero_division=0)
f1 = f1_score(y_true, y_pred_classes, average='weighted', zero_division=0)

print(f"✅ Accuracy:  {accuracy * 100:.2f}%")
print(f"🎯 Precision: {precision * 100:.2f}%")
print(f"🔍 Recall:    {recall * 100:.2f}%")
print(f"⚖️ F1-Score:  {f1 * 100:.2f}%")
print("="*50)

# Make the confusion matrix chart larger to fit 10 classes
cm = confusion_matrix(y_true, y_pred_classes)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('AI Confusion Matrix (10 Classes)')
plt.ylabel('Actual Image Class')
plt.xlabel('AI Prediction')
plt.savefig('confusion_matrix.png')
print("\n📊 Saved 'confusion_matrix.png' to your folder. Put this in your presentation!")