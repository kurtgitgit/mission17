import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.utils.class_weight import compute_class_weight

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# IMPORTANT: Pointing to the new split dataset folder
DATASET_DIR = os.path.join(BASE_DIR, '..', '..', '..', 'dataset', 'mission_dataset_split', 'train')
MODEL_SAVE_PATH = os.path.join(BASE_DIR, '..', '..', 'mission_model.h5')
LABELS_SAVE_PATH = os.path.join(BASE_DIR, '..', '..', 'labels.txt')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_INITIAL = 20
EPOCHS_FINETUNE = 15
LR_INITIAL = 1e-3
LR_FINETUNE = 1e-5

def build_generators():
    print("📸 Preparing Image Generators...")

    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.7, 1.3],
        zoom_range=0.2,
        validation_split=0.2 # 20% of the train/ folder becomes validation
    )

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        shuffle=True
    )

    validation_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )

    return train_generator, validation_generator

def get_class_weights(train_generator):
    """
    Calculates class weights to handle imbalanced datasets.
    This stops the AI from being biased toward the majority class.
    """
    print("⚖️ Calculating Class Weights for balanced training...")
    class_indices = train_generator.class_indices
    classes = train_generator.classes

    weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(classes),
        y=classes
    )
    class_weights = dict(enumerate(weights))
    
    print("   Weights applied:")
    for cls_name, cls_idx in class_indices.items():
        print(f"   - {cls_name}: {class_weights[cls_idx]:.2f}")
        
    return class_weights

def build_model(num_classes):
    print("🧠 Building Model (EfficientNetB0)...")

    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=IMG_SIZE + (3,)
    )
    base_model.trainable = False 

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    return model, base_model

def get_callbacks(phase_name):
    return [
        EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7, verbose=1),
        ModelCheckpoint(filepath=MODEL_SAVE_PATH, monitor='val_accuracy', save_best_only=True, verbose=1)
    ]

def train_brain():
    print("🚀 Initializing Mission 17 AI Training v2 (Optimized)...")

    if not os.path.exists(DATASET_DIR):
        print(f"❌ ERROR: Training Dataset not found at {DATASET_DIR}")
        print("   Did you run scripts/testing/split_dataset.py first?")
        return

    train_generator, validation_generator = build_generators()

    # Save Labels
    class_names = list(train_generator.class_indices.keys())
    with open(LABELS_SAVE_PATH, 'w') as f:
        for name in class_names:
            f.write(name + '\n')
            
    num_classes = len(class_names)
    
    # Get Class Weights
    class_weights = get_class_weights(train_generator)

    model, base_model = build_model(num_classes)

    # --- PHASE 1 ---
    print("\n" + "="*50)
    print("🏋️  PHASE 1: Training Top Layers (Base Frozen)")
    print("="*50)

    model.compile(optimizer=Adam(learning_rate=LR_INITIAL), loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(
        train_generator,
        epochs=EPOCHS_INITIAL,
        validation_data=validation_generator,
        class_weight=class_weights, # Apply weights!
        callbacks=get_callbacks('phase1')
    )

    # --- PHASE 2 ---
    print("\n" + "="*50)
    print("🔬 PHASE 2: Fine-Tuning Top Base Layers")
    print("="*50)

    base_model.trainable = True
    for layer in base_model.layers[:150]:
        layer.trainable = False

    model.compile(optimizer=Adam(learning_rate=LR_FINETUNE), loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(
        train_generator,
        epochs=EPOCHS_FINETUNE,
        validation_data=validation_generator,
        class_weight=class_weights, # Apply weights!
        callbacks=get_callbacks('phase2')
    )

    print(f"\n✅ Training complete! Model saved to {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    train_brain()
