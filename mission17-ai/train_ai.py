import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import os

# 👇 CONFIGURATION (Updated to match your screenshot)
DATASET_DIR = os.path.join("dataset", "garbage_classification") 
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10 

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

print(f"🔍 Looking for data in: {DATASET_DIR}")

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

# 2. LOAD PRE-TRAINED MODEL (MobileNetV2)
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False # Freeze base model

# 3. ADD CUSTOM LAYERS
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.2)(x)
predictions = Dense(train_generator.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# 4. COMPILE & TRAIN
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

print(f"🚀 Starting training for {EPOCHS} epochs...")
history = model.fit(
    train_generator,
    steps_per_epoch=train_generator.samples // BATCH_SIZE,
    validation_data=validation_generator,
    validation_steps=validation_generator.samples // BATCH_SIZE,
    epochs=EPOCHS
)

# 5. SAVE THE MODEL
print("✅ Training Complete! Saving model...")
model.save("mission17_trash_classifier.h5")

# Save labels mapping
with open("labels.txt", "w") as f:
    for class_name, index in train_generator.class_indices.items():
        f.write(f"{index} {class_name}\n")

print("🎉 Model saved as 'mission17_trash_classifier.h5'")
print("📝 Labels saved as 'labels.txt'")