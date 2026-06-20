import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', '..', '..', 'dataset', 'mission_dataset')
MODEL_SAVE_PATH = os.path.join(BASE_DIR, '..', '..', 'mission_model.h5')
LABELS_SAVE_PATH = os.path.join(BASE_DIR, '..', '..', 'labels.txt')

# Hyperparameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_INITIAL = 25      # Phase 1: Train top layers only
EPOCHS_FINETUNE = 15     # Phase 2: Fine-tune top base layers
LR_INITIAL = 1e-3        # Higher LR for initial training
LR_FINETUNE = 1e-5       # Much lower LR for fine-tuning (prevents forgetting)
FINETUNE_FROM_LAYER = 150  # Unfreeze EfficientNetB0 from this layer onwards

def build_generators():
    """Create training and validation data generators with strong augmentation."""
    print("📸 Preparing Image Generators with Strong Augmentation...")

    # 🔥 EfficientNetB0 has its own internal preprocessing — do NOT use rescale=1./255!
    # Using preprocess_input correctly scales raw 0-255 pixel values for EfficientNet.
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,  # ✅ EfficientNetB0-compatible
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.7, 1.3],
        zoom_range=0.2,
        shear_range=0.1,
        channel_shift_range=20.0,
        fill_mode='nearest',
        validation_split=0.2
    )

    # Validation: only preprocess_input, NO augmentation
    val_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,  # ✅ Must match training
        validation_split=0.2
    )

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        shuffle=True
    )

    validation_generator = val_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )

    return train_generator, validation_generator


def build_model(num_classes):
    """
    Build model using EfficientNetB0 (more accurate than MobileNetV2).
    Phase 1 starts with all base layers FROZEN — only top layers train first.
    """
    print("🧠 Building Model (EfficientNetB0 — upgraded from MobileNetV2)...")

    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=IMG_SIZE + (3,)
    )
    base_model.trainable = False  # Freeze all base layers for Phase 1

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)          # ✨ NEW — stabilizes training
    x = Dropout(0.3)(x)                  # was 0.2 — slightly stronger regularization
    x = Dense(256, activation='relu')(x) # ✨ NEW — extra dense layer for richer features
    x = Dropout(0.2)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    return model, base_model


def get_callbacks(phase_name):
    """Smart callbacks: stop early if no improvement, reduce LR on plateau."""
    return [
        EarlyStopping(
            monitor='val_accuracy',
            patience=5,              # Stop if no improvement for 5 epochs
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,              # Halve LR if stuck
            patience=3,
            min_lr=1e-7,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=MODEL_SAVE_PATH,
            monitor='val_accuracy',
            save_best_only=True,     # Always keep the best checkpoint
            verbose=1
        )
    ]


def train_brain():
    print("🚀 Initializing Mission 17 AI Training (Enhanced)...")

    # 1. CHECK DATASET
    if not os.path.exists(DATASET_DIR):
        print(f"❌ ERROR: Dataset not found at {DATASET_DIR}")
        return

    # 2. BUILD GENERATORS
    try:
        train_generator, validation_generator = build_generators()
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

    num_classes = len(class_names)

    # 4. BUILD MODEL
    model, base_model = build_model(num_classes)

    # ════════════════════════════════════════════
    # PHASE 1: Train top layers only (fast)
    # ════════════════════════════════════════════
    print("\n" + "="*50)
    print("🏋️  PHASE 1: Training Top Layers (Base Frozen)")
    print("="*50)

    model.compile(
        optimizer=Adam(learning_rate=LR_INITIAL),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    model.fit(
        train_generator,
        epochs=EPOCHS_INITIAL,
        validation_data=validation_generator,
        callbacks=get_callbacks('phase1')
    )

    # ════════════════════════════════════════════
    # PHASE 2: Fine-tune top layers of base model
    # ════════════════════════════════════════════
    print("\n" + "="*50)
    print("🔬 PHASE 2: Fine-Tuning Top Base Layers")
    print(f"   Unfreezing EfficientNetB0 from layer {FINETUNE_FROM_LAYER}+")
    print("="*50)

    base_model.trainable = True

    # Only unfreeze layers AFTER FINETUNE_FROM_LAYER — keep earlier layers frozen
    for layer in base_model.layers[:FINETUNE_FROM_LAYER]:
        layer.trainable = False

    # CRITICAL: Recompile with much lower LR to avoid destroying pre-trained weights
    model.compile(
        optimizer=Adam(learning_rate=LR_FINETUNE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    model.fit(
        train_generator,
        epochs=EPOCHS_FINETUNE,
        validation_data=validation_generator,
        callbacks=get_callbacks('phase2')
    )

    print(f"\n✅ Training complete! Best model saved to {MODEL_SAVE_PATH}")
    print("   Run evaluate_model.py to check accuracy metrics & confusion matrix.")


if __name__ == '__main__':
    train_brain()