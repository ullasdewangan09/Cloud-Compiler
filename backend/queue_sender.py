import json
import uuid
from datetime import datetime, timezone

from redis_config import QUEUE_NAME, redis_client as r


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def send_to_queue(job_data: dict):
    payload = dict(job_data)
    payload.setdefault("job_id", str(uuid.uuid4()))
    payload.setdefault("submitted_at", utc_now_iso())

    r.lpush(QUEUE_NAME, json.dumps(payload))
    r.set(
        f"job:{payload['job_id']}",
        json.dumps(
            {
                "job_id": payload["job_id"],
                "language": payload.get("language", ""),
                "status": "submitted",
                "submitted_at": payload["submitted_at"],
                "started_at": None,
                "finished_at": None,
                "queue_wait_ms": None,
                "compile_time_ms": None,
                "execution_time_ms": None,
                "total_time_ms": None,
                "stdout": "",
                "stderr": "",
                "output": "",
                "error": "",
                "artifacts": [],
                "diagnostics": {
                    "summary": "",
                    "details": [],
                    "error_stage": None,
                },
            }
        ),
    )

    return payload["job_id"]


def send_job(code, language="python", user_input=""):

    job = {
        "code": code,
        "language": language,
        "input": user_input
    }

    return send_to_queue(job)

