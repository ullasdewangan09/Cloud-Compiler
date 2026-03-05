import time
import redis
from k8s.k8s_manager import scale_workers

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

QUEUE_NAME = "code_queue"

MIN_WORKERS = 1
MAX_WORKERS = 10
JOBS_PER_WORKER = 3

COOLDOWN = 10

last_scale_time = 0
current_workers = 1
last_queue_length = None


def autoscaler_loop():

    global last_scale_time
    global current_workers
    global last_queue_length

    # print("Autoscaler started")

    while True:

        queue_length = redis_client.llen(QUEUE_NAME)

        required_workers = max(
            MIN_WORKERS,
            min(MAX_WORKERS, (queue_length // JOBS_PER_WORKER) + 1)
        )

        if queue_length != last_queue_length:
            print(f"Queue: {queue_length} -> Workers: {required_workers}")
            last_queue_length = queue_length

        now = time.time()

        # scale only if different
        if required_workers != current_workers:

            if now - last_scale_time > COOLDOWN:

                print(f"Scaling workers: {current_workers} → {required_workers}")

                scale_workers(required_workers)

                current_workers = required_workers
                last_scale_time = now

        time.sleep(7)
