"""Metrics collection utilities."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import psutil

from redis_config import QUEUE_NAME, redis_client

WORKER_REGISTRY_KEY = "worker_registry"
EXECUTION_HISTORY_KEY = "execution_history"
WORKER_STALE_SECONDS = 30


def _safe_json_load(raw_item):
    try:
        return json.loads(raw_item)
    except (json.JSONDecodeError, TypeError):
        return None


def _recent_history(limit: int = 200) -> list[dict]:
    raw_items = redis_client.lrange(EXECUTION_HISTORY_KEY, 0, max(0, limit - 1))
    items: list[dict] = []
    for raw_item in raw_items:  # type: ignore[union-attr]
        payload = _safe_json_load(raw_item)
        if payload:
            items.append(payload)
    return items


def get_queue_metrics():
    history = _recent_history(100)
    queue_wait_values = [item.get("queue_wait_ms") for item in history if item.get("queue_wait_ms") is not None]
    return {
        "queue_length": redis_client.llen(QUEUE_NAME),
        "average_queue_wait_ms": round(sum(queue_wait_values) / len(queue_wait_values), 2) if queue_wait_values else 0,
        "max_queue_wait_ms": round(max(queue_wait_values), 2) if queue_wait_values else 0,
        "recent_queue_wait": [
            {
                "job_id": item.get("job_id"),
                "queue_wait_ms": item.get("queue_wait_ms") or 0,
            }
            for item in history[:20]
        ][::-1],
    }


def get_worker_metrics():
    raw_workers = redis_client.hgetall(WORKER_REGISTRY_KEY)
    now = int(datetime.now(timezone.utc).timestamp())

    workers = {}
    stale_worker_ids = []
    running_jobs = 0

    for worker_id, raw_payload in raw_workers.items():
        payload = _safe_json_load(raw_payload)
        if payload is None:
            stale_worker_ids.append(worker_id)
            continue

        updated_at = int(payload.get("updated_at", 0))
        if now - updated_at > WORKER_STALE_SECONDS:
            stale_worker_ids.append(worker_id)
            continue

        status = payload.get("status", "unknown")
        if status == "running":
            running_jobs += 1

        workers[worker_id] = {
            "status": status,
            "current_job": payload.get("current_job"),
            "updated_at": updated_at,
        }

    if stale_worker_ids:
        redis_client.hdel(WORKER_REGISTRY_KEY, *stale_worker_ids)

    return {
        "active_workers": len(workers),
        "running_jobs": running_jobs,
        "workers": workers,
    }


def get_system_metrics():
    cpu_usage = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()

    return {
        "cpu_usage_percent": cpu_usage,
        "memory_usage_percent": memory.percent,
    }


def get_job_metrics():
    history = _recent_history(500)
    status_counts = {
        "success": 0,
        "compile_error": 0,
        "runtime_error": 0,
        "timeout": 0,
        "system_error": 0,
    }
    total_time_values = []
    compile_values = []
    execution_values = []

    for item in history:
        status = item.get("status", "system_error")
        if status not in status_counts:
            status_counts[status] = 0
        status_counts[status] += 1

        if item.get("total_time_ms") is not None:
            total_time_values.append(float(item["total_time_ms"]))
        if item.get("compile_time_ms") is not None:
            compile_values.append(float(item["compile_time_ms"]))
        if item.get("execution_time_ms") is not None:
            execution_values.append(float(item["execution_time_ms"]))

    total_jobs = sum(status_counts.values())
    failed_jobs = sum(
        status_counts.get(status, 0)
        for status in ["compile_error", "runtime_error", "timeout", "system_error"]
    )
    completed_jobs = status_counts.get("success", 0)

    trend = [
        {
            "job_id": item.get("job_id"),
            "language": item.get("language"),
            "status": item.get("status"),
            "total_time_ms": item.get("total_time_ms") or 0,
            "queue_wait_ms": item.get("queue_wait_ms") or 0,
            "execution_time_ms": item.get("execution_time_ms") or 0,
        }
        for item in history[:30]
    ][::-1]

    return {
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "status_counts": status_counts,
        "success_rate_percent": round((completed_jobs / total_jobs) * 100, 2) if total_jobs else 0,
        "average_total_time_ms": round(sum(total_time_values) / len(total_time_values), 2) if total_time_values else 0,
        "average_compile_time_ms": round(sum(compile_values) / len(compile_values), 2) if compile_values else 0,
        "average_execution_time_ms": round(sum(execution_values) / len(execution_values), 2) if execution_values else 0,
        "latency_trend": trend,
    }


def get_recent_executions(limit: int = 20):
    history = _recent_history(limit)
    recent = []

    for item in history:
        recent.append(
            {
                "job_id": item.get("job_id"),
                "user": item.get("username", "anonymous"),
                "language": item.get("language", "unknown"),
                "status": item.get("status", "unknown"),
                "queue_wait_ms": item.get("queue_wait_ms"),
                "execution_time_ms": item.get("execution_time_ms"),
                "total_time_ms": item.get("total_time_ms"),
                "error": item.get("error", ""),
            }
        )

    return recent


def get_platform_snapshot():
    queue = get_queue_metrics()
    workers = get_worker_metrics()
    jobs = get_job_metrics()
    return {
        "queue_length": queue["queue_length"],
        "active_workers": workers["active_workers"],
        "running_jobs": workers["running_jobs"],
        "completed_jobs": jobs["completed_jobs"],
        "failed_jobs": jobs["failed_jobs"],
        "success_rate_percent": jobs["success_rate_percent"],
        "average_total_time_ms": jobs["average_total_time_ms"],
    }
