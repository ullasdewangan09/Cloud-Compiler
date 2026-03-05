system_state = {
    "queue_length": 0,
    "active_workers": 0,
    "running_jobs": 0,
    "completed_jobs": 0,
    "failed_jobs": 0
}

def update_queue_length(length):
    system_state["queue_length"] = length

def increment_running_jobs():
    system_state["running_jobs"] += 1

def job_completed():
    system_state["running_jobs"] -= 1
    system_state["completed_jobs"] += 1

def job_failed():
    system_state["running_jobs"] -= 1
    system_state["failed_jobs"] += 1

def get_system_state():
    return system_state