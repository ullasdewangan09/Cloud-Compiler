"""API routes for metrics endpoints."""
from fastapi import APIRouter, Depends
from dependencies import require_admin
from metrics_collector import (
    get_queue_metrics,
    get_worker_metrics,
    get_system_metrics,
    get_job_metrics
)

router = APIRouter(prefix="/metrics", tags=["Monitoring"])

@router.get("/queue")
def queue_metrics(admin=Depends(require_admin)):
    return get_queue_metrics()


@router.get("/workers")
def worker_metrics(admin=Depends(require_admin)):
    return get_worker_metrics()


@router.get("/system")
def system_metrics(admin=Depends(require_admin)):
    return get_system_metrics()


@router.get("/jobs")
def job_metrics(admin=Depends(require_admin)):
    return get_job_metrics()
