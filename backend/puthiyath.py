print("=== SCRIPT STARTED ===")

import cv2
import mediapipe as mp
import csv
import numpy as np
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from yolo_inference import detect_dumping, draw_yolo_boxes


INPUT_VIDEO    = "dataset/DUMPING/dump3.mp4"
OUTPUT_VIDEO   = "output_with_alerts.mp4"
DETECTIONS_CSV = "detections.csv"
SNAPSHOTS_DIR  = "snapshots"

DEBOUNCE_FRAMES          = 3
ALERT_COOLDOWN_FRAMES    = 150
SNAPSHOT_INTERVAL_FRAMES = 10

SMTP_SERVER          = "smtp.gmail.com"
SMTP_PORT            = 587
ALERT_EMAIL          = os.getenv("ALERT_EMAIL")
ALERT_EMAIL_PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD")
RECIPIENT_EMAIL      = os.getenv("RECIPIENT_EMAIL")

ALERT_SMS_ENABLED  = True
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE       = os.getenv("TWILIO_PHONE")
RECIPIENT_PHONE    = os.getenv("RECIPIENT_PHONE")

# ---------------------------------------------------------------------------
# FUSION MODE
# FIX: changed default to "lstm" since YOLO heuristic is unreliable without
#      a trained model. YOLO boxes are still drawn for visual reference.
#      Switch to "either" once you have a trained yolo_model.pt
# ---------------------------------------------------------------------------
FUSION_MODE = "lstm"

# ---------------------------------------------------------------------------
# LSTM confidence threshold — minimum confidence before LSTM triggers alert
# The logs showed 99.8% confidence BUT action was still "Normal Action"
# meaning the model output index 0 (Normal) had 99.8% confidence.
# Added explicit debug output below to verify which class is winning.
# ---------------------------------------------------------------------------
LSTM_DUMP_THRESHOLD = 0.60   # if dumping softmax score exceeds this → flag it


def send_email_alert(subject, body):
    try:
        msg = MIMEMultipart()
        msg["From"]    = ALERT_EMAIL
        msg["To"]      = RECIPIENT_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(ALERT_EMAIL, ALERT_EMAIL_PASSWORD)
        server.sendmail(ALERT_EMAIL, RECIPIENT_EMAIL, msg.as_string())
        server.quit()
        print("[Email] Alert Sent")
    except Exception as e:
        print("[Email Error]", e)


def send_twilio_sms(text):
    try:
        client  = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(body=text, from_=TWILIO_PHONE, to=RECIPIENT_PHONE)
        print("[SMS] Sent:", message.sid)
    except Exception as e:
        print("[SMS Error]", e)


def draw_info_overlay(frame, action, confidence, frame_no, time_sec, detector="LSTM"):
    overlay = frame.copy()
    h, w    = frame.shape[:2]
    cv2.rectangle(overlay, (0, 0), (w, 100), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.55, frame, 0.45, 0, overlay)
    action_color = (0, 0, 255) if action == "Dumping Detected" else (0, 255, 0)
    cv2.putText(overlay, action, (15, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, action_color, 2, cv2.LINE_AA)
    bar_x, bar_y, bar_w, bar_h = 15, 48, 300, 14
    cv2.rectangle(overlay, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (80, 80, 80), -1)
    fill_w    = int(bar_w * confidence)
    bar_color = (0, 0, 220) if action == "Dumping Detected" else (0, 200, 0)
    cv2.rectangle(overlay, (bar_x, bar_y), (bar_x + fill_w, bar_y + bar_h), bar_color, -1)
    cv2.putText(overlay, f"Confidence: {confidence*100:.1f}%",
                (bar_x + bar_w + 10, bar_y + 11),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(overlay, f"Frame: {frame_no}   Time: {time_sec:.2f}s   [{detector}]",
                (15, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 200), 1, cv2.LINE_AA)
    return overlay


def fuse_decisions(lstm_action, lstm_conf, yolo_action, yolo_conf, mode):
    lstm_dump = lstm_action == "Dumping Detected"
    yolo_dump = yolo_action == "Dumping Detected"
    if mode == "both":
        if lstm_dump and yolo_dump:
            return "Dumping Detected", (lstm_conf + yolo_conf) / 2, "LSTM+YOLO"
        return "Normal Action", max(lstm_conf, yolo_conf), "LSTM+YOLO"
    elif mode == "either":
        if lstm_dump or yolo_dump:
            return "Dumping Detected", max(lstm_conf, yolo_conf), "LSTM|YOLO"
        return "Normal Action", (lstm_conf + yolo_conf) / 2, "LSTM|YOLO"
    elif mode == "lstm":
        return lstm_action, lstm_conf, "LSTM"
    elif mode == "yolo":
        return yolo_action, yolo_conf, "YOLO"
    return lstm_action, lstm_conf, "LSTM"


# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

cap = cv2.VideoCapture(INPUT_VIDEO)
if not cap.isOpened():
    raise RuntimeError("Cannot open video")

width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps    = cap.get(cv2.CAP_PROP_FPS) or 20.0

fourcc = cv2.VideoWriter_fourcc(*'H264')
out    = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (width, height))
if not out.isOpened():
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out    = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (width, height))
    if not out.isOpened():
        raise RuntimeError("Video writer error")

mp_pose    = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.35, min_tracking_confidence=0.35)

# Import the raw model to get full softmax output for debugging
import tensorflow as tf
_lstm_model = tf.keras.models.load_model("lstm_model.h5")
_sequence_buffer = []
SEQUENCE_LENGTH  = 30

frame_no         = 0
dump_buffer      = 0
last_alert_frame = -1
last_snap_frame  = -1

print(f"[Config] Fusion mode : {FUSION_MODE}")
print(f"[Config] LSTM dump threshold: {LSTM_DUMP_THRESHOLD}")
print("[Config] YOLO boxes shown for visual reference (not affecting decisions in lstm mode)")

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
with open(DETECTIONS_CSV, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "frame", "time_seconds", "action", "confidence",
        "detector", "lstm_action", "lstm_conf", "yolo_action", "yolo_conf"
    ])

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_no += 1
        time_sec  = frame_no / fps

        # ── LSTM — get full softmax output for proper thresholding ──────────
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results   = pose.process(frame_rgb)

        lstm_action = "Normal Action"
        lstm_conf   = 0.0
        normal_conf = 0.0
        dump_conf_raw = 0.0

        if results.pose_landmarks:
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            # Build sequence buffer
            frame_data = []
            for lm in results.pose_landmarks.landmark:
                frame_data.extend([lm.x, lm.y, lm.z, lm.visibility])
            _sequence_buffer.append(frame_data)
            if len(_sequence_buffer) > SEQUENCE_LENGTH:
                _sequence_buffer.pop(0)

            if len(_sequence_buffer) == SEQUENCE_LENGTH:
                input_data    = np.expand_dims(_sequence_buffer, axis=0)
                prediction    = _lstm_model.predict(input_data, verbose=0)
                normal_conf   = float(prediction[0][0])   # index 0 = Normal
                dump_conf_raw = float(prediction[0][1])   # index 1 = Dumping

                # FIX: use explicit threshold on dump index instead of argmax
                # argmax was picking index 0 (Normal) at 99.8% and reporting
                # that confidence — making it look like high-conf dumping
                if dump_conf_raw >= LSTM_DUMP_THRESHOLD:
                    lstm_action = "Dumping Detected"
                    lstm_conf   = dump_conf_raw
                else:
                    lstm_action = "Normal Action"
                    lstm_conf   = dump_conf_raw   # show dump score even when not triggered

                # Debug every 30 frames
                if frame_no % 30 == 0:
                    print(f"  [LSTM debug] Frame {frame_no}: "
                          f"normal={normal_conf*100:.1f}%  dump={dump_conf_raw*100:.1f}%  "
                          f"→ {lstm_action}")

        # ── YOLO ────────────────────────────────────────────────────────────
        yolo_action, yolo_conf_val, yolo_boxes = detect_dumping(frame)
        draw_yolo_boxes(frame, yolo_boxes)

        # ── Fusion ──────────────────────────────────────────────────────────
        final_action, final_conf, detector_label = fuse_decisions(
            lstm_action, lstm_conf, yolo_action, yolo_conf_val, FUSION_MODE
        )

        # ── Debounce ────────────────────────────────────────────────────────
        if final_action == "Dumping Detected":
            dump_buffer += 1
        else:
            dump_buffer = 0

        announced = "Dumping Detected" if dump_buffer >= DEBOUNCE_FRAMES else "Normal Action"

        # ── HUD ─────────────────────────────────────────────────────────────
        color = (0, 0, 255) if announced == "Dumping Detected" else (0, 255, 0)
        cv2.putText(frame, announced, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
        cv2.putText(frame, f"Conf: {final_conf*100:.1f}%  [{detector_label}]",
                    (30, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.60, color, 2)
        cv2.putText(frame, f"LSTM dump score: {dump_conf_raw*100:.1f}%  normal: {normal_conf*100:.1f}%",
                    (30, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 255), 1)
        cv2.putText(frame, f"YOLO: {yolo_action[:6]}  {yolo_conf_val*100:.0f}%",
                    (30, 133), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 215, 0), 1)

        # ── Snapshots ───────────────────────────────────────────────────────
        if announced == "Dumping Detected":
            frames_since_snap = (frame_no - last_snap_frame
                                 if last_snap_frame >= 0 else SNAPSHOT_INTERVAL_FRAMES + 1)
            if frames_since_snap >= SNAPSHOT_INTERVAL_FRAMES:
                snap      = draw_info_overlay(frame, announced, final_conf,
                                              frame_no, time_sec, detector_label)
                snap_path = os.path.join(SNAPSHOTS_DIR,
                                         f"frame_{frame_no:06d}_conf{int(final_conf*100)}.jpg")
                saved = cv2.imwrite(snap_path, snap)
                print(f"[Snapshot] {'Saved' if saved else 'FAILED'}: {snap_path}")
                last_snap_frame = frame_no

        # ── Alerts ──────────────────────────────────────────────────────────
        if announced == "Dumping Detected":
            frames_since_alert = (frame_no - last_alert_frame
                                  if last_alert_frame >= 0 else ALERT_COOLDOWN_FRAMES + 1)
            if frames_since_alert > ALERT_COOLDOWN_FRAMES:
                msg = (f"Waste dumping detected at {time_sec:.2f}s "
                       f"(Frame {frame_no}) | Confidence: {final_conf*100:.1f}% "
                       f"| Detector: {detector_label}")
                send_email_alert("Dumping Detected!", msg)
                if ALERT_SMS_ENABLED:
                    send_twilio_sms(msg)
                last_alert_frame = frame_no

        out.write(frame)
        writer.writerow([
            frame_no, f"{time_sec:.3f}", announced, f"{final_conf:.4f}",
            detector_label, lstm_action, f"{lstm_conf:.4f}",
            yolo_action, f"{yolo_conf_val:.4f}",
        ])

        print(f"Frame {frame_no}: {announced} "
              f"(dump_score:{dump_conf_raw*100:.1f}%  yolo:{yolo_conf_val*100:.1f}%)")

        cv2.imshow("Dumping Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
cap.release()
out.release()
pose.close()
cv2.destroyAllWindows()
print("Finished:", OUTPUT_VIDEO)   