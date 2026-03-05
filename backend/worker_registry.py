workers = {}

def register_worker(worker_id):
    workers[worker_id] = {
        "status": "idle",
        "current_job": None
    }

def update_worker(worker_id, status, job=None):
    if worker_id in workers:
        workers[worker_id]["status"] = status
        workers[worker_id]["current_job"] = job

def get_workers():
    return workers