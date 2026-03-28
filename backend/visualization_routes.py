from fastapi import APIRouter, Depends
from dependencies import require_admin
from metrics_collector import (
    get_queue_metrics,
    get_worker_metrics,
    get_system_metrics,
    get_recent_executions,
    get_job_metrics,
    get_platform_snapshot,
)

router = APIRouter(prefix="/visualization", tags=["Visualization"])

@router.get("/dashboard")
def dashboard_data(admin=Depends(require_admin)):
    queue_metrics = get_queue_metrics()
    worker_metrics = get_worker_metrics()
    system_metrics = get_system_metrics()
    job_metrics = get_job_metrics()
    return {
        "system_state": get_platform_snapshot(),
        "queue_metrics": queue_metrics,
        "worker_metrics": worker_metrics,
        "system_metrics": system_metrics,
        "job_metrics": job_metrics,
        "recent_executions": get_recent_executions(),
    }
