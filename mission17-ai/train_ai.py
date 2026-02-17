import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import os

# 👇 CONFIGURATION
# We point to the folder containing BOTH old trash and NEW SDG folders
DATASET_DIR = os.path.join("dataset", "mission_dataset") 
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10 

print(f"🔍 Loading dataset from: {DATASET_DIR}")

if not os.path.exists(DATASET_DIR):
    print("❌ ERROR: Dataset folder not found!")
    exit()

# 1. SETUP DATA GENERATORS (Augmentation)
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest',
    validation_split=0.2 # Use 20% for testing
)

# Load Training Data
train_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

# Load Validation Data
validation_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# 2. SAVE LABELS (Crucial Step!)
# We save them as a clean list so app.py can read them easily
labels = {v: k for k, v in train_generator.class_indices.items()}
print(f"🏷️  Classes detected: {list(labels.values())}")

with open("labels.txt", "w") as f:
    for i in range(len(labels)):
        f.write(labels[i] + "\n")
print("✅ Saved 'labels.txt'")

# 3. BUILD MODEL (MobileNetV2)
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False # Freeze base model

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.3)(x) # Drop 30% to prevent overfitting
predictions = Dense(train_generator.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# 4. COMPILE & TRAIN
model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

print(f"🚀 Starting training for {EPOCHS} epochs...")
history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // BATCH_SIZE,
    epochs=EPOCHS
)

# 5. SAVE THE MODEL
# We save as 'mission_model.h5' to distinguish from the old one
print("✅ Training Complete! Saving model...")
model.save("mission_model.h5")
print("🎉 SUCCESS! New Brain saved as 'mission_model.h5'")