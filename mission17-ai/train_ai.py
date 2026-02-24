import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam

# --- CONFIGURATION ---
# Paths relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset', 'mission_dataset')
MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'mission_model.h5')
LABELS_SAVE_PATH = os.path.join(BASE_DIR, 'labels.txt')

# Hyperparameters
IMG_SIZE = (224, 224) # Matches app.py target_size
BATCH_SIZE = 32
EPOCHS = 25
LEARNING_RATE = 0.0001

def train_brain():
    print("🚀 Initializing Mission 17 AI Training...")
    
    # 1. CHECK DATASET
    if not os.path.exists(DATASET_DIR):
        print(f"❌ ERROR: Dataset not found at {DATASET_DIR}")
        print("   Please create a 'dataset' folder in the project root.")
        print("   Inside, create folders for each class (e.g., 'Planting', 'Recycling').")
        return

    # 2. DATA PREPARATION (Augmentation)
    print("📸 Preparing Image Generators...")
    train_datagen = ImageDataGenerator(
        rescale=1./255,         # Normalize pixel values
        rotation_range=20,      # Random rotations
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        validation_split=0.2    # Use 20% of data for validation
    )

    try:
        train_generator = train_datagen.flow_from_directory(
            DATASET_DIR,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='categorical',
            subset='training'
        )

        validation_generator = train_datagen.flow_from_directory(
            DATASET_DIR,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='categorical',
            subset='validation'
        )
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return

    if train_generator.samples == 0:
        print("❌ No images found! Check your dataset structure.")
        return

    # 3. SAVE LABELS
    class_names = list(train_generator.class_indices.keys())
    print(f"🏷️  Classes Detected: {class_names}")
    with open(LABELS_SAVE_PATH, 'w') as f:
        for name in class_names:
            f.write(name + '\n')
    print(f"✅ Labels saved to {LABELS_SAVE_PATH}")

    # 4. BUILD MODEL (MobileNetV2 Transfer Learning)
    print("🧠 Building Model (MobileNetV2)...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=IMG_SIZE + (3,))
    base_model.trainable = False # Freeze base layers

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x) # Prevent overfitting
    predictions = Dense(len(class_names), activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    model.compile(optimizer=Adam(learning_rate=LEARNING_RATE),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    # 5. TRAIN
    print("🏋️ Training Started...")
    model.fit(train_generator, epochs=EPOCHS, validation_data=validation_generator)

    # 6. SAVE
    model.save(MODEL_SAVE_PATH)
    print(f"✅ Model saved successfully to {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    train_brain()