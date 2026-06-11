import numpy as np
import tensorflow as tf

# Load trained model
model = tf.keras.models.load_model("lstm_model.h5")

SEQUENCE_LENGTH = 30
sequence_buffer = []

def predict_action(landmarks):
    global sequence_buffer

    frame_data = []
    for lm in landmarks:
        frame_data.extend([lm.x, lm.y, lm.z, lm.visibility])

    sequence_buffer.append(frame_data)

    # Keep only last 30 frames
    if len(sequence_buffer) > SEQUENCE_LENGTH:
        sequence_buffer.pop(0)

    if len(sequence_buffer) == SEQUENCE_LENGTH:
        input_data = np.expand_dims(sequence_buffer, axis=0)
        prediction = model.predict(input_data, verbose=0)

        label      = np.argmax(prediction)
        confidence = float(prediction[0][label])   # real softmax probability

        if label == 1:
            return "Dumping Detected", confidence
        else:
            return "Normal Action", confidence

    # Buffer not full yet — default to normal with 0 confidence
    return "Normal Action", 0.0