import cv2
import os
import numpy as np
import mediapipe as mp
import sys
import traceback

import sys
print("PYTHON =", sys.executable)
print("RUNNING extract_keypoints.py")


mp_pose = mp.solutions.pose
SEQUENCE_LENGTH = 30

DATASET_DIR = "dataset"
OUTPUT_FILE = "keypoints.npy"
LABEL_FILE = "labels.npy"

# Ensure dataset folders exist
for folder in ["NORMAL", "DUMPING"]:
    path = os.path.join(DATASET_DIR, folder)
    if not os.path.exists(path):
        print(f"[WARN] Creating missing folder: {path}")
        os.makedirs(path, exist_ok=True)

def extract_keypoints_from_video(video_path):
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"[ERROR] Cannot open video: {video_path}")
            return None
        pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5)
        keypoints_seq = []
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            frame = cv2.resize(frame, (640, 480))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            if results.pose_landmarks:
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y, lm.z, lm.visibility])
                keypoints_seq.append(landmarks)
        cap.release()
        pose.close()

        if len(keypoints_seq) == 0:
            print(f"[INFO] No landmarks extracted from: {video_path} (frames read: {frame_count})")
            return None

        keypoints_seq = np.array(keypoints_seq)

        # Ensure fixed length: 30 frames
        if len(keypoints_seq) >= SEQUENCE_LENGTH:
            keypoints_seq = keypoints_seq[:SEQUENCE_LENGTH]
        else:
            padding = np.zeros((SEQUENCE_LENGTH - len(keypoints_seq), 33 * 4))
            keypoints_seq = np.vstack((keypoints_seq, padding))

        return keypoints_seq
    except Exception as e:
        print(f"[EXC] Failed processing {video_path}: {e}")
        traceback.print_exc()
        return None

# ====================== MAIN ======================
all_sequences = []
all_labels = []

label_map = {"NORMAL": 0, "DUMPING": 1}

for label_name, label in label_map.items():
    action_folder = os.path.join(DATASET_DIR, label_name)
    if not os.path.exists(action_folder):
        print(f"[WARN] Folder missing, skipping: {action_folder}")
        continue
    files = [f for f in os.listdir(action_folder) if f.lower().endswith((".mp4",".avi",".mov",".mkv"))]
    if not files:
        print(f"[INFO] No video files found in {action_folder}; please add videos and re-run.")
        continue
    for video in files:
        path = os.path.join(action_folder, video)
        print(f"[PROCESS] {label_name} -> {video}")
        seq = extract_keypoints_from_video(path)
        if seq is None:
            print(f"[SKIP] {video} (no keypoints)")
            continue
        all_sequences.append(seq)
        all_labels.append(label)

if len(all_sequences) == 0:
    print("[ERROR] No sequences extracted. Dataset is empty or videos did not yield landmarks.")
    sys.exit(1)

np.save(OUTPUT_FILE, np.array(all_sequences))
np.save(LABEL_FILE, np.array(all_labels))

print("Dataset extracted successfully!")
print(f"Saved {len(all_sequences)} sequences to {OUTPUT_FILE} and labels to {LABEL_FILE}")
