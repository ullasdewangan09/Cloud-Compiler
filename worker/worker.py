import atexit
import json
import os
import socket
import time
import uuid

import docker
import redis
from docker.errors import DockerException
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import ReadTimeout
from redis.exceptions import ConnectionError as RedisConnectionError

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
QUEUE_NAME = os.getenv("QUEUE_NAME", "code_queue")
WORKER_REGISTRY_KEY = os.getenv("WORKER_REGISTRY_KEY", "worker_registry")
WORKER_ID = os.getenv(
    "WORKER_ID",
    f"{socket.gethostname()}-{os.getpid()}-{uuid.uuid4().hex[:6]}"
)

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
docker_client = None
DOCKER_API_TIMEOUT_SECONDS = int(os.getenv("DOCKER_API_TIMEOUT_SECONDS", "20"))
EXECUTION_TIMEOUT_SECONDS = int(os.getenv("EXECUTION_TIMEOUT_SECONDS", "10"))


def update_worker_status(status: str, current_job: str | None = None):
    payload = {
        "status": status,
        "current_job": current_job,
        "updated_at": int(time.time())
    }
    r.hset(WORKER_REGISTRY_KEY, WORKER_ID, json.dumps(payload))


def unregister_worker():
    try:
        r.hdel(WORKER_REGISTRY_KEY, WORKER_ID)
    except Exception:
        pass


def get_docker_client():
    global docker_client

    if docker_client is not None:
        return docker_client

    try:
        client = docker.from_env(timeout=DOCKER_API_TIMEOUT_SECONDS)
        client.ping()
        docker_client = client
        return docker_client
    except (DockerException, RequestsConnectionError, ReadTimeout) as e:
        print(f"[worker] Docker unavailable: {e}")
        return None


def execute_code(code, language, user_input=""):
    client = get_docker_client()
    if client is None:
        return "Docker is unavailable. Please make sure Docker is running."

    if language == "python":
        filename = "code.py"
        image = "python-runner"
        run_command = "python code.py"

    elif language == "cpp":
        filename = "code.cpp"
        image = "cpp-runner"
        run_command = "g++ code.cpp -o program && ./program"

    elif language == "java":
        filename = "Code.java"
        image = "java-runner"
        run_command = "javac Code.java && java Code"

    elif language == "c":
        filename = "code.c"
        image = "c-runner"
        run_command = "gcc code.c -o program && ./program"

    else:
        return "Unsupported language"

    with open(filename, "w", encoding="utf-8") as f:
        f.write(code)

    if user_input:
        with open("input.txt", "w", encoding="utf-8") as f:
            f.write(user_input)
        run_command = f"{run_command} < input.txt"

    container = None
    try:
        container = client.containers.run(
            image=image,
            command=["sh", "-lc", run_command],
            volumes={
                os.getcwd(): {"bind": "/app", "mode": "rw"},
            },
            working_dir="/app",
            mem_limit="256m",
            nano_cpus=500000000,
            network_disabled=True,
            detach=True,
            stdin_open=False,
            tty=False,
        )

        container.wait(timeout=EXECUTION_TIMEOUT_SECONDS)
        logs = container.logs().decode("utf-8")
        return logs

    except (ReadTimeout, RequestsConnectionError) as e:
        if container is None:
            return f"Docker daemon request timed out: {e}"

        try:
            container.kill()
        except Exception:
            pass
        return f"Error: Execution timed out ({EXECUTION_TIMEOUT_SECONDS} seconds limit)"

    except Exception as e:
        return str(e)

    finally:
        if container is not None:
            try:
                container.remove(force=True)
            except Exception:
                pass


def worker_loop():
    print("[worker] Worker started...")
    update_worker_status("idle")

    while True:
        try:
            job = r.brpop(QUEUE_NAME, timeout=5)
        except RedisConnectionError as e:
            print(f"[worker] Redis unavailable: {e}")
            time.sleep(2)
            continue

        if job:
            _, data = job
            try:
                job_data = json.loads(data)
            except json.JSONDecodeError as e:
                print(f"[worker] Invalid job payload: {e}")
                time.sleep(1)
                continue

            job_id = job_data.get("job_id")
            if not job_id:
                print("[worker] Invalid job payload: missing job_id")
                time.sleep(1)
                continue

            print("[worker] Executing job...")
            update_worker_status("running", job_id)

            result = execute_code(
                job_data.get("code", ""),
                job_data.get("language", ""),
                job_data.get("input", ""),
            )

            r.set(f"result:{job_id}", result)
            update_worker_status("idle")

            history_entry = {
                "job_id": job_id,
                "language": job_data.get("language", ""),
                "code": job_data.get("code", ""),
                "output": result,
            }
            r.lpush("execution_history", json.dumps(history_entry))

            print("===== OUTPUT =====")
            print(result)
        else:
            update_worker_status("idle")

        time.sleep(1)


if __name__ == "__main__":
    atexit.register(unregister_worker)
    try:
        worker_loop()
    except KeyboardInterrupt:
        print("\n[worker] Shutdown requested.")
    finally:
        unregister_worker()
