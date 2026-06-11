from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import pandas as pd
import os
import re
import asyncio
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DETECTIONS_CSV = "detections.csv"
EVENTS_CSV     = "events.csv"
SNAPSHOTS_DIR  = "snapshots"

os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=SNAPSHOTS_DIR), name="snapshots")


def _parse_conf(value):
    try:
        v = float(value)
        return round(v, 4) if not pd.isna(v) else None
    except (TypeError, ValueError):
        return None


@app.get("/api/detections")
def get_detections():
    if not os.path.exists(DETECTIONS_CSV):
        return []
    df = pd.read_csv(DETECTIONS_CSV)
    records = []
    for _, row in df.iterrows():
        records.append({
            "frame":       int(row.get("frame", 0)),
            "time":        f"{float(row.get('time_seconds', 0)):.3f}",
            "action":      str(row.get("action", "Normal Action")),
            "confidence":  _parse_conf(row.get("confidence")),
            # New YOLO fields — None when old CSV format (backward compatible)
            "detector":    str(row["detector"])    if "detector"    in df.columns else "LSTM",
            "lstm_action": str(row["lstm_action"]) if "lstm_action" in df.columns else str(row.get("action", "")),
            "lstm_conf":   _parse_conf(row.get("lstm_conf")),
            "yolo_action": str(row["yolo_action"]) if "yolo_action" in df.columns else "N/A",
            "yolo_conf":   _parse_conf(row.get("yolo_conf")),
        })
    return records


@app.get("/api/events")
def get_events():
    if not os.path.exists(EVENTS_CSV):
        return []
    df = pd.read_csv(EVENTS_CSV)
    records = []
    for _, row in df.iterrows():
        records.append({
            "frame":      int(row.get("frame", 0)),
            "timestamp":  f"{float(row.get('timestamp', row.get('time_seconds', 0))):.3f}",
            "action":     str(row.get("action", "Normal Action")),
            "confidence": _parse_conf(row.get("confidence")),
        })
    return records


@app.get("/api/snapshots")
def get_snapshots():
    if not os.path.exists(SNAPSHOTS_DIR):
        return []
    files = sorted(
        [f for f in os.listdir(SNAPSHOTS_DIR)
         if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))],
        key=lambda f: os.path.getmtime(os.path.join(SNAPSHOTS_DIR, f)),
        reverse=True,
    )
    result = []
    for name in files:
        stat    = os.stat(os.path.join(SNAPSHOTS_DIR, name))
        frame_m = re.search(r"frame_(\d+)", name, re.IGNORECASE)
        conf_m  = re.search(r"conf(\d+)",   name, re.IGNORECASE)
        frame_num  = int(frame_m.group(1)) if frame_m else None
        conf_pct   = int(conf_m.group(1))  if conf_m  else None
        result.append({
            "id":         name,
            "name":       f"Frame {frame_num}" if frame_num is not None else name,
            "url":        f"/snapshots/{name}",
            "mtime":      stat.st_mtime * 1000,
            "timestamp":  pd.Timestamp(stat.st_mtime, unit="s").strftime("%I:%M:%S %p"),
            "frame":      frame_num,
            "action":     "Dumping Detected",
            "confidence": round(conf_pct / 100, 2) if conf_pct is not None else None,
        })
    return result


@app.get("/api/stats")
def get_stats():
    if not os.path.exists(DETECTIONS_CSV):
        return {}
    df      = pd.read_csv(DETECTIONS_CSV)
    total   = len(df)
    dumping = len(df[df["action"] == "Dumping Detected"])
    normal  = len(df[df["action"] == "Normal Action"])
    pose_frames = dumping + normal
    avg_conf = None
    if "confidence" in df.columns:
        valid    = df["confidence"].dropna().astype(float)
        avg_conf = round(float(valid.mean()) * 100, 1) if len(valid) else None
    snap_count = len([
        f for f in os.listdir(SNAPSHOTS_DIR)
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    ]) if os.path.exists(SNAPSHOTS_DIR) else 0

    stats = {
        "totalFrames":       total,
        "poseFrames":        pose_frames,
        "dumpingDetected":   dumping,
        "normalActions":     normal,
        "dumpingPercentage": round(dumping / pose_frames * 100, 1) if pose_frames else 0.0,
        "avgConfidence":     avg_conf,
        "snapshotCount":     snap_count,
    }

    # YOLO breakdown — only when new CSV columns exist
    if "yolo_action" in df.columns and "lstm_action" in df.columns:
        yolo_dump = len(df[df["yolo_action"] == "Dumping Detected"])
        lstm_dump = len(df[df["lstm_action"] == "Dumping Detected"])
        both_dump = len(df[
            (df["yolo_action"] == "Dumping Detected") &
            (df["lstm_action"] == "Dumping Detected")
        ])
        avg_lstm_conf, avg_yolo_conf = None, None
        if "lstm_conf" in df.columns:
            v = df["lstm_conf"].dropna().astype(float)
            avg_lstm_conf = round(float(v.mean()) * 100, 1) if len(v) else None
        if "yolo_conf" in df.columns:
            v = df["yolo_conf"].dropna().astype(float)
            avg_yolo_conf = round(float(v.mean()) * 100, 1) if len(v) else None

        stats["detectorBreakdown"] = {
            "yoloDumping":  yolo_dump,
            "lstmDumping":  lstm_dump,
            "bothDumping":  both_dump,
            "avgLstmConf":  avg_lstm_conf,
            "avgYoloConf":  avg_yolo_conf,
            "fusionMode":   str(df["detector"].iloc[0]) if "detector" in df.columns else "LSTM",
        }
    return stats


@app.get("/api/timeline")
def get_timeline():
    detections, events = [], []
    if os.path.exists(DETECTIONS_CSV):
        detections = pd.read_csv(DETECTIONS_CSV).fillna("").to_dict(orient="records")
    if os.path.exists(EVENTS_CSV):
        events = pd.read_csv(EVENTS_CSV).fillna("").to_dict(orient="records")
    timeline = sorted(
        [{ **d, "type": "detection", "source": "detections.csv" } for d in detections] +
        [{ **e, "type": "event",     "source": "events.csv"     } for e in events],
        key=lambda x: float(x.get("time_seconds", x.get("timestamp", 0))),
    )
    duration = 0.0
    if timeline:
        t0 = float(timeline[0].get("time_seconds",  timeline[0].get("timestamp",  0)))
        t1 = float(timeline[-1].get("time_seconds", timeline[-1].get("timestamp", 0)))
        duration = t1 - t0
    return {
        "timeline": timeline,
        "summary": {
            "totalEntries":    len(timeline),
            "detectionsCount": len(detections),
            "eventsCount":     len(events),
            "timeRange": {
                "start":    timeline[0].get("time_seconds",  0) if timeline else 0,
                "end":      timeline[-1].get("time_seconds", 0) if timeline else 0,
                "duration": f"{duration:.2f}",
            },
        },
    }


@app.get("/api/stream-snapshots")
async def stream_snapshots():
    async def event_generator():
        snapshots  = get_snapshots()
        last_count = len(snapshots)
        yield f"event: snapshots\ndata: {json.dumps(snapshots)}\n\n"
        while True:
            await asyncio.sleep(2)
            try:
                current_files = [
                    f for f in os.listdir(SNAPSHOTS_DIR)
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
                ] if os.path.exists(SNAPSHOTS_DIR) else []
                snapshots = get_snapshots()
                if len(current_files) != last_count:
                    last_count = len(current_files)
                    yield f"event: snapshots\ndata: {json.dumps(snapshots)}\n\n"
                else:
                    yield f"event: snapshot_heartbeat\ndata: {json.dumps(snapshots)}\n\n"
            except Exception as e:
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/health")
def health():
    snap_count = len([
        f for f in os.listdir(SNAPSHOTS_DIR)
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    ]) if os.path.exists(SNAPSHOTS_DIR) else 0
    has_yolo = False
    if os.path.exists(DETECTIONS_CSV):
        try:
            has_yolo = "yolo_action" in pd.read_csv(DETECTIONS_CSV, nrows=0).columns.tolist()
        except Exception:
            pass
    return {
        "status":           "healthy",
        "detections_exist": os.path.exists(DETECTIONS_CSV),
        "events_exist":     os.path.exists(EVENTS_CSV),
        "snapshots_exist":  os.path.exists(SNAPSHOTS_DIR),
        "snapshot_count":   snap_count,
        "yolo_enabled":     has_yolo,
        "detections_rows":  len(pd.read_csv(DETECTIONS_CSV)) if os.path.exists(DETECTIONS_CSV) else 0,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)