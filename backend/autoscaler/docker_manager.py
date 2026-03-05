import docker
import os
import tempfile
import uuid
import subprocess
import time

client = docker.from_env()

running_workers = []

WORKER_IMAGES = {
    "python": "python-runner:latest",
    "c": "c-runner:latest",
    "cpp": "cpp-runner:latest",
    "java": "java-runner:latest"
}


def start_worker(language="python"):

    image = WORKER_IMAGES.get(language)

    container = client.containers.run(
        image,
        detach=True
    )

    running_workers.append(container.id)

    print(f"Started worker {container.id}")

    return container.id


def stop_worker():

    if running_workers:

        container_id = running_workers.pop()

        container = client.containers.get(container_id)

        container.stop()
        container.remove()

        print(f"Stopped worker {container_id}")


def scale_workers(target_workers, language="python"):
    """Scale Docker workers to a target count."""
    desired_workers = max(0, int(target_workers))
    current_workers = len(running_workers)

    if desired_workers > current_workers:
        for _ in range(desired_workers - current_workers):
            start_worker(language=language)
    elif desired_workers < current_workers:
        for _ in range(current_workers - desired_workers):
            stop_worker()


class DockerManager:

    MAX_EXECUTION_TIME = 10
    MEMORY_LIMIT = "256m"
    CPU_LIMIT = "1"
    PIDS_LIMIT = "100"

    LANGUAGE_CONFIG = {
        "python": {
            "filename": "code.py",
            "command": "python code.py"
        },
        "c": {
            "filename": "code.c",
            "command": "gcc code.c -o program && ./program"
        },
        "cpp": {
            "filename": "code.cpp",
            "command": "g++ code.cpp -o program && ./program"
        },
        "java": {
            "filename": "Code.java",
            "command": "javac Code.java && java Code"
        }
    }

    def run_container(self, language, code, user_input=""):

        image_name = WORKER_IMAGES.get(language)
        config = self.LANGUAGE_CONFIG.get(language)
        if not image_name or not config:
            return {
                "status": "runtime_error",
                "output": "",
                "error": f"Unsupported language: {language}",
                "execution_time": None
            }

        container_name = f"exec_{uuid.uuid4().hex}"
        start_time = time.time()

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                code_path = os.path.join(temp_dir, config["filename"])
                with open(code_path, "w", encoding="utf-8") as code_file:
                    code_file.write(code)

                run_command = config["command"]
                if user_input:
                    input_path = os.path.join(temp_dir, "input.txt")
                    with open(input_path, "w", encoding="utf-8") as input_file:
                        input_file.write(user_input)
                    run_command = f"{run_command} < input.txt"

                command = [
                    "docker",
                    "run",
                    "--name",
                    container_name,
                    "--rm",
                    "--memory",
                    self.MEMORY_LIMIT,
                    "--cpus",
                    self.CPU_LIMIT,
                    "--pids-limit",
                    self.PIDS_LIMIT,
                    "--network",
                    "none",
                    "-v",
                    f"{temp_dir}:/app",
                    "-w",
                    "/app",
                    image_name,
                    "sh",
                    "-lc",
                    run_command
                ]

                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                try:
                    stdout, stderr = process.communicate(timeout=self.MAX_EXECUTION_TIME)
                except subprocess.TimeoutExpired:
                    subprocess.run(
                        ["docker", "kill", container_name],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )
                    process.communicate()
                    return {
                        "status": "timeout",
                        "output": "",
                        "error": f"Execution exceeded {self.MAX_EXECUTION_TIME} seconds",
                        "execution_time": None
                    }

                execution_time = round(time.time() - start_time, 3)

                if process.returncode != 0:
                    return {
                        "status": "runtime_error",
                        "output": stdout,
                        "error": stderr,
                        "execution_time": execution_time
                    }
                return {
                    "status": "success",
                    "output": stdout,
                    "error": "",
                    "execution_time": execution_time
                }

        except Exception as e:

            return {
                "status": "system_error",
                "output": "",
                "error": str(e),
                "execution_time": None
            }
