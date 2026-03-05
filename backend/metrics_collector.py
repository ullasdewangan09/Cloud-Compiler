"""Metrics collection utilities."""
import json
import psutil
from redis_config import redis_client, QUEUE_NAME
from datetime import datetime, timezone

WORKER_REGISTRY_KEY = "worker_registry"
EXECUTION_HISTORY_KEY = "execution_history"
WORKER_STALE_SECONDS = 30

def get_queue_metrics():
    queue_length = redis_client.llen(QUEUE_NAME)

    return {
        "queue_length": queue_length
    }

def get_worker_metrics():
    raw_workers = redis_client.hgetall(WORKER_REGISTRY_KEY)
    now = int(datetime.now(timezone.utc).timestamp())

    workers = {}
    stale_worker_ids = []

    for worker_id, raw_payload in raw_workers.items():
        try:
            payload = json.loads(raw_payload)
        except (json.JSONDecodeError, TypeError):
            stale_worker_ids.append(worker_id)
            continue

        updated_at = int(payload.get("updated_at", 0))
        if now - updated_at > WORKER_STALE_SECONDS:
            stale_worker_ids.append(worker_id)
            continue

        workers[worker_id] = {
            "status": payload.get("status", "unknown"),
            "current_job": payload.get("current_job")
        }

    if stale_worker_ids:
        redis_client.hdel(WORKER_REGISTRY_KEY, *stale_worker_ids)

    return {
        "active_workers": len(workers),
        "workers": workers
    }

def get_system_metrics():
    cpu_usage = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()

    return {
        "cpu_usage_percent": cpu_usage,
        "memory_usage_percent": memory.percent
    }

def get_job_metrics():
    raw_items = redis_client.lrange(EXECUTION_HISTORY_KEY, 0, 499)

    completed_jobs = 0
    failed_jobs = 0

    for raw_item in raw_items:
        try:
            payload = json.loads(raw_item)
        except (json.JSONDecodeError, TypeError):
            continue

        output = (payload.get("output") or "").lower()
        if any(token in output for token in ["error", "exception", "traceback", "timeout", "unsupported"]):
            failed_jobs += 1
        else:
            completed_jobs += 1

    return {
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs
    }


def get_recent_executions(limit: int = 20):
    raw_items = redis_client.lrange(EXECUTION_HISTORY_KEY, 0, max(0, limit - 1))
    recent = []

    for raw_item in raw_items:
        try:
            payload = json.loads(raw_item)
        except (json.JSONDecodeError, TypeError):
            continue

        output = (payload.get("output") or "").lower()
        status = "success"
        if any(token in output for token in ["error", "exception", "traceback", "timeout", "unsupported"]):
            status = "failed"

        recent.append({
            "job_id": payload.get("job_id"),
            "user": payload.get("username", "anonymous"),
            "language": payload.get("language", "unknown"),
            "status": status,
        })

    return recent
