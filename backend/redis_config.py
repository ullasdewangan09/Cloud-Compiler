import redis

REDIS_HOST = "localhost"
REDIS_PORT = 6379
QUEUE_NAME = "code_queue"

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)
