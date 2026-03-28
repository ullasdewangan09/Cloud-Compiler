import atexit
import json
import os
import socket
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import redis
from redis.exceptions import ConnectionError as RedisConnectionError

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.execution_engine import execute_in_docker, serialize_result  # noqa: E402

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
QUEUE_NAME = os.getenv("QUEUE_NAME", "code_queue")
WORKER_REGISTRY_KEY = os.getenv("WORKER_REGISTRY_KEY", "worker_registry")
WORKER_ID = os.getenv(
    "WORKER_ID",
    f"{socket.gethostname()}-{os.getpid()}-{uuid.uuid4().hex[:6]}",
)
EXECUTION_TIMEOUT_SECONDS = int(os.getenv("EXECUTION_TIMEOUT_SECONDS", "10"))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def update_worker_status(status: str, current_job: str | None = None):
    payload = {
        "status": status,
        "current_job": current_job,
        "updated_at": int(time.time()),
    }
    r.hset(WORKER_REGISTRY_KEY, WORKER_ID, json.dumps(payload))


def unregister_worker():
    try:
        r.hdel(WORKER_REGISTRY_KEY, WORKER_ID)
    except Exception:
        pass


def worker_loop():
    print("[worker] Worker started...")
    update_worker_status("idle")

    while True:
        try:
            job = r.brpop(QUEUE_NAME, timeout=5)
        except RedisConnectionError as exc:
            print(f"[worker] Redis unavailable: {exc}")
            time.sleep(2)
            continue

        if not job:
            update_worker_status("idle")
            time.sleep(1)
            continue

        _, data = job
        try:
            job_data = json.loads(data)
        except json.JSONDecodeError as exc:
            print(f"[worker] Invalid job payload: {exc}")
            time.sleep(1)
            continue

        job_id = job_data.get("job_id")
        if not job_id:
            print("[worker] Invalid job payload: missing job_id")
            time.sleep(1)
            continue

        print(f"[worker] Executing job {job_id}...")
        update_worker_status("running", job_id)

        submitted_at = job_data.get("submitted_at") or utc_now_iso()
        started_at = utc_now_iso()
        try:
            queue_wait_ms = round(
                (
                    datetime.fromisoformat(started_at).timestamp()
                    - datetime.fromisoformat(submitted_at).timestamp()
                )
                * 1000,
                2,
            )
        except ValueError:
            queue_wait_ms = None

        r.set(
            f"job:{job_id}",
            json.dumps(
                {
                    "job_id": job_id,
                    "language": job_data.get("language", ""),
                    "status": "running",
                    "submitted_at": submitted_at,
                    "started_at": started_at,
                    "finished_at": None,
                    "queue_wait_ms": queue_wait_ms,
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

        result = execute_in_docker(
            {
                "language": job_data.get("language", ""),
                "code": job_data.get("code", ""),
                "input": job_data.get("input", ""),
                "files": job_data.get("files"),
                "entry_file": job_data.get("entry_file"),
                "compiler_profile": job_data.get("compiler_profile"),
                "compiler_flags": job_data.get("compiler_flags", ""),
                "submitted_at": submitted_at,
                "queue_wait_ms": queue_wait_ms,
            },
            max_execution_time=EXECUTION_TIMEOUT_SECONDS,
            cpu_limit="0.5",
        )

        serialized = serialize_result(
            job_id,
            job_data.get("language", ""),
            result,
            username=job_data.get("username", "anonymous"),
        )

        r.set(f"job:{job_id}", serialized)
        r.set(f"result:{job_id}", serialized)
        update_worker_status("idle")

        history_entry = {
            "job_id": job_id,
            "username": job_data.get("username", "anonymous"),
            "language": job_data.get("language", ""),
            "files": job_data.get("files", []),
            "entry_file": result.get("entry_file"),
            "status": result.get("status"),
            "output": result.get("output", ""),
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", ""),
            "error": result.get("error", ""),
            "diagnostics": result.get("diagnostics", {}),
            "submitted_at": result.get("submitted_at"),
            "started_at": result.get("started_at"),
            "finished_at": result.get("finished_at"),
            "queue_wait_ms": result.get("queue_wait_ms"),
            "compile_time_ms": result.get("compile_time_ms"),
            "execution_time_ms": result.get("execution_time_ms"),
            "total_time_ms": result.get("total_time_ms"),
        }
        r.lpush("execution_history", json.dumps(history_entry))
        r.ltrim("execution_history", 0, 999)

        print("===== OUTPUT =====")
        print(result.get("output", ""))
        time.sleep(1)


if __name__ == "__main__":
    atexit.register(unregister_worker)
    try:
        worker_loop()
    except KeyboardInterrupt:
        print("\n[worker] Shutdown requested.")
    finally:
        unregister_worker()
