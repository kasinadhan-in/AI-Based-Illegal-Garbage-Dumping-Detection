"""
yolo_inference.py
-----------------
Pretrained YOLOv8n — person detection + posture heuristic.

FIX 1: Raised DUMP_ASPECT_THRESHOLD to reduce false positives on walking people.
FIX 2: Added consecutive-frame confirmation — person must trigger dumping
        posture for MIN_CONSECUTIVE_FRAMES frames before flagging.
FIX 3: Lowered PERSON_CONF_THRESHOLD slightly to not miss distant people.
"""

_model = None
YOLO_MODEL_PATH = "yolov8n.pt"

# ---------------------------------------------------------------------------
# Thresholds — tightened to avoid false positives on walking people
# ---------------------------------------------------------------------------
PERSON_CONF_THRESHOLD    = 0.45
DUMP_ASPECT_THRESHOLD    = 1.05   # FIX 1: raised from 0.80 → crouching is wider
                                   # walking person box ≈ 0.3-0.7, crouching ≈ 1.0+
DUMP_VERTICAL_THRESHOLD  = 0.60   # box bottom must be in lower 40% of frame
MIN_CONSECUTIVE_FRAMES   = 4      # FIX 2: must see crouching pose for 4+ frames

# Internal state — consecutive frame counter per tracked region
_consecutive_dump_count = 0


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO
    except ImportError:
        raise RuntimeError("Run:  pip install ultralytics")
    print(f"[YOLO] Loading pretrained model: {YOLO_MODEL_PATH}")
    _model = YOLO(YOLO_MODEL_PATH)
    print("[YOLO] Ready — person detection + posture heuristic")
    return _model


def _is_crouching(box, frame_h, frame_w):
    """
    Returns (is_crouching: bool, score: float)
    Uses stricter criteria than before to avoid walking false positives.
    """
    x1, y1, x2, y2 = box
    bw = x2 - x1
    bh = y2 - y1
    if bh == 0:
        return False, 0.0

    aspect_ratio  = bw / bh          # crouching: wide box (ratio > 1.0)
    box_bottom    = y2 / frame_h     # must be near ground
    box_top       = y1 / frame_h     # top of box
    box_height_pct = bh / frame_h    # person height relative to frame

    # A crouching/dumping person:
    # 1. Wide box (aspect ratio high)
    # 2. Bottom of box near ground level
    # 3. Box is NOT very tall (they're compressed)
    is_crouching = (
        aspect_ratio   >= DUMP_ASPECT_THRESHOLD   and
        box_bottom     >= DUMP_VERTICAL_THRESHOLD and
        box_height_pct <= 0.55                     # not a full standing person
    )

    # Confidence score
    ar_score   = min(aspect_ratio / DUMP_ASPECT_THRESHOLD, 1.0)
    vert_score = min(box_bottom / DUMP_VERTICAL_THRESHOLD, 1.0)
    size_score = 1.0 - min(box_height_pct / 0.5, 1.0)
    combined   = (ar_score * 0.5) + (vert_score * 0.3) + (size_score * 0.2)

    confidence = 0.5 + (combined * 0.45) if is_crouching else combined * 0.35
    return is_crouching, round(min(confidence, 0.95), 4)


def detect_dumping(frame):
    """
    Returns (action, confidence, boxes)
    FIX 2: requires MIN_CONSECUTIVE_FRAMES of crouching before declaring dumping
    """
    global _consecutive_dump_count

    try:
        model   = _load_model()
        h, w    = frame.shape[:2]
        results = model(frame, verbose=False, conf=PERSON_CONF_THRESHOLD,
                        classes=[0])[0]   # class 0 = person (COCO)

        boxes        = []
        frame_has_crouch = False
        best_conf    = 0.0

        for det in results.boxes:
            det_conf        = float(det.conf[0])
            x1, y1, x2, y2 = map(int, det.xyxy[0].tolist())
            is_crouching, dump_conf = _is_crouching([x1, y1, x2, y2], h, w)

            boxes.append({
                "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                "conf":      det_conf,
                "label":     "Crouching" if is_crouching else "Person",
                "dumping":   False,        # set below after consecutive check
                "dump_conf": dump_conf,
            })

            if is_crouching:
                frame_has_crouch = True
                if dump_conf > best_conf:
                    best_conf = dump_conf

        # FIX 2: consecutive frame gate
        if frame_has_crouch:
            _consecutive_dump_count += 1
        else:
            _consecutive_dump_count = 0
            best_conf = max((b["conf"] for b in boxes), default=0.0)

        confirmed_dumping = _consecutive_dump_count >= MIN_CONSECUTIVE_FRAMES

        # Update box labels to reflect confirmed state
        if confirmed_dumping:
            for b in boxes:
                if b["label"] == "Crouching":
                    b["dumping"] = True
                    b["label"]   = "Dumping"

        action = "Dumping Detected" if confirmed_dumping else "Normal Action"
        return action, best_conf, boxes

    except Exception as e:
        print(f"[YOLO Error] {e}")
        _consecutive_dump_count = 0
        return "Normal Action", 0.0, []


def draw_yolo_boxes(frame, boxes):
    import cv2
    for b in boxes:
        if b.get("dumping"):
            color = (0, 0, 255)       # red — confirmed dumping
        elif b["label"] == "Crouching":
            color = (0, 165, 255)     # orange — crouching but not yet confirmed
        else:
            color = (255, 100, 0)     # blue — normal person

        cv2.rectangle(frame, (b["x1"], b["y1"]), (b["x2"], b["y2"]), color, 2)

        conf = b["dump_conf"] if b["label"] in ("Crouching", "Dumping") else b["conf"]
        text = f"{b['label']} {conf*100:.0f}%"

        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(frame,
                      (b["x1"], b["y1"] - th - 6),
                      (b["x1"] + tw + 4, b["y1"]),
                      color, -1)
        cv2.putText(frame, text,
                    (b["x1"] + 2, b["y1"] - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
    return frame