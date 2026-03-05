from fastapi import APIRouter, Depends
from dependencies import require_admin
from system_state import get_system_state
from metrics_collector import (
    get_queue_metrics,
    get_worker_metrics,
    get_system_metrics,
    get_recent_executions
)

router = APIRouter(prefix="/visualization", tags=["Visualization"])

@router.get("/dashboard")
def dashboard_data(admin=Depends(require_admin)):
    return {
        "system_state": get_system_state(),
        "queue_metrics": get_queue_metrics(),
        "worker_metrics": get_worker_metrics(),
        "system_metrics": get_system_metrics(),
        "recent_executions": get_recent_executions()
    }
