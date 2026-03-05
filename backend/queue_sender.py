import redis
import json
import uuid

r = redis.Redis(host="localhost", port=6379, db=0)

def send_to_queue(job_data: dict):
    payload = dict(job_data)
    payload.setdefault("job_id", str(uuid.uuid4()))

    r.lpush("code_queue", json.dumps(payload))

    return payload["job_id"]


def send_job(code, language="python", user_input=""):

    job = {
        "code": code,
        "language": language,
        "input": user_input
    }

    return send_to_queue(job)

