import docker

from execution_engine import execute_in_docker

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

    def run_container(
        self,
        language,
        code,
        user_input="",
        *,
        files=None,
        entry_file=None,
        compiler_profile=None,
        compiler_flags="",
    ):
        payload = {
            "language": language,
            "code": code,
            "input": user_input,
            "files": files,
            "entry_file": entry_file,
            "compiler_profile": compiler_profile,
            "compiler_flags": compiler_flags,
        }
        return execute_in_docker(
            payload,
            max_execution_time=self.MAX_EXECUTION_TIME,
            memory_limit=self.MEMORY_LIMIT,
            cpu_limit=self.CPU_LIMIT,
            pids_limit=self.PIDS_LIMIT,
        )
