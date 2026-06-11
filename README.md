# AI-Based Illegal Garbage Dumping Detection System

## Overview

The AI-Based Illegal Garbage Dumping Detection System is a real-time intelligent surveillance solution designed to identify unauthorized waste disposal activities from video streams. The system combines human pose estimation, deep learning-based action recognition, and object detection techniques to automatically detect dumping events and generate alerts for monitoring authorities.

The proposed approach leverages MediaPipe Pose for extracting human skeletal keypoints, an LSTM-based temporal model for action classification, and YOLO for object detection support. The system processes surveillance footage in real time, logs events, captures evidence snapshots, and generates notifications upon detection of illegal dumping activities.

---

## Features

* Real-time surveillance video analysis
* Human pose estimation using MediaPipe Pose
* LSTM-based temporal action recognition
* YOLO-based object detection integration
* Automated illegal dumping detection
* Event logging and detection history generation
* Snapshot capture for detected incidents
* Email and SMS alert support
* Confidence-based decision making and event debouncing
* Lightweight deployment suitable for edge and CPU-based systems

---

## System Architecture

1. Video Stream Input
2. Human Pose Extraction using MediaPipe
3. Temporal Sequence Generation
4. LSTM-Based Action Classification
5. YOLO Object Detection Support
6. Decision Fusion and Event Verification
7. Alert Generation and Logging
8. Snapshot Storage and Monitoring Dashboard

![System Architecture](screenshots/architecture.png)

---

## Technologies Used

* Python
* TensorFlow / Keras
* OpenCV
* MediaPipe Pose
* YOLOv8
* NumPy
* FastAPI
* Twilio API
* SMTP Email Services

---

## Project Workflow

1. Capture video frames from surveillance cameras.
2. Extract skeletal keypoints using MediaPipe Pose.
3. Construct temporal pose sequences.
4. Classify activities using an LSTM network.
5. Detect relevant objects using YOLO.
6. Fuse detection results and verify events.
7. Generate alerts and store evidence.
8. Log incidents for future analysis.

---

## Dataset

A custom dataset was created containing:

* Normal human activities
* Unauthorized garbage dumping activities

Each sample consists of temporal pose sequences extracted from surveillance-style video recordings.

---

## Applications

* Smart City Monitoring
* Campus Surveillance
* Public Area Monitoring
* Environmental Protection Systems
* Automated Waste Management Enforcement

---

## Future Enhancements

* Multi-camera deployment
* Cloud-based monitoring dashboard
* Mobile alert application
* Advanced activity recognition models
* Edge AI deployment optimization

---

## Installation

```bash
pip install -r requirements.txt
```

Run the detection system:

```bash
python dumping_detection.py
```

---

## License

This project is intended for academic and research purposes.
