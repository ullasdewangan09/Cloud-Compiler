"""Scaling policy definitions and thresholds."""
import math

QUEUE_SCALE_UP_THRESHOLD = 5
QUEUE_SCALE_DOWN_THRESHOLD = 0

MAX_WORKERS = 10
MIN_WORKERS = 1


def calculate_required_workers(queue_size: int) -> int:
    """Return the number of workers needed for the current queue size."""
    normalized_queue_size = max(0, int(queue_size))

    if normalized_queue_size <= QUEUE_SCALE_DOWN_THRESHOLD:
        return MIN_WORKERS

    workers_needed = math.ceil(normalized_queue_size / QUEUE_SCALE_UP_THRESHOLD)

    return max(MIN_WORKERS, min(MAX_WORKERS, workers_needed))
