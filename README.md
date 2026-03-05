# Cloud Compiler

Cloud Compiler is a full-stack coding platform where users can write code in the browser, run it in isolated Docker containers, and view execution output and metrics.

## What this project includes

- Frontend app (React + TypeScript + Vite + Monaco Editor)
- Backend API (FastAPI)
- Worker service (Python + Redis queue + Docker execution)
- Metrics and visualization endpoints (admin-protected)
- File import/export and PDF export
- Basic auth with JWT

## Architecture

1. Frontend sends code execution requests to backend.
2. Backend pushes async jobs to Redis queue (`code_queue`) or runs sync execution directly.
3. Worker pulls queued jobs from Redis, executes code in Docker, and stores results back in Redis.
4. Frontend polls job status and displays output.

## Supported languages

- Python
- C
- C++
- Java

## Project structure

```text
Cloud Compiler/
  backend/    # FastAPI API, auth, queueing, metrics, autoscaler hooks
  frontend/   # React app and Monaco editor UI
  worker/     # Queue worker and language runner Dockerfiles
  SETUP.md    # Earlier setup notes
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- Docker Desktop (running)
- Redis (running on `localhost:6379`)
- PostgreSQL (for auth/user tables)

## Local setup

### 1) Build runner images

```powershell
cd worker
docker build -t python-runner docker_images/python
docker build -t c-runner docker_images/c
docker build -t cpp-runner docker_images/cpp
docker build -t java-runner docker_images/java
```

### 2) Backend setup

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Note: backend code also imports packages such as `sqlalchemy`, `python-jose`, `python-multipart`, `psycopg2`, and `kubernetes`. Install any missing modules if startup reports `ModuleNotFoundError`.

### 3) Worker setup

```powershell
cd worker
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4) Frontend setup

```powershell
cd frontend
npm install
```

## Configuration

### Frontend

Set API URL with:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

Current code uses hardcoded database/redis defaults:

- `backend/database.py` -> `DATABASE_URL` (PostgreSQL)
- `backend/redis_config.py` -> Redis host/port
- `backend/queue_sender.py` -> Redis host/port

Update these values for your environment.

### Worker

Worker supports env vars:

- `REDIS_HOST` (default `localhost`)
- `REDIS_PORT` (default `6379`)
- `QUEUE_NAME` (default `code_queue`)
- `WORKER_REGISTRY_KEY` (default `worker_registry`)
- `DOCKER_API_TIMEOUT_SECONDS` (default `20`)
- `EXECUTION_TIMEOUT_SECONDS` (default `10`)

## Run the system

Open 3 terminals.

### Terminal A: backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### Terminal B: worker

```powershell
cd worker
.venv\Scripts\Activate.ps1
py worker.py
```

### Terminal C: frontend

```powershell
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1c6c79e3-c9e4-41fd-8fc8-58d5d0f74e2e" />

## API summary

### Public/auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /`

### Execution

- `POST /complexity`
- `POST /execute` (async queue job)
- `GET /execute/result/{job_id}`
- `POST /execute/sync`
- `POST /import-file`
- `POST /export-file`

### Admin-protected

- `GET /admin/stats`
- `GET /metrics/queue`
- `GET /metrics/workers`
- `GET /metrics/system`
- `GET /metrics/jobs`
- `GET /visualization/dashboard`

## Security and execution limits

- Code executes inside Docker containers
- Network is disabled for execution containers
- Memory and CPU limits are applied
- Execution timeout is enforced

## Notes

- The editor/backend sanitize pasted hidden unicode characters (including square box glyphs) before execution.
- The backend starts an autoscaler loop on startup and imports Kubernetes scaling code. Ensure Kubernetes config is available if you want autoscaling enabled.

## Troubleshooting

- Docker errors: confirm Docker Desktop is running.
- Redis errors: confirm Redis is reachable on configured host/port.
- DB auth errors: verify PostgreSQL is running and `DATABASE_URL` is correct.
- `ModuleNotFoundError` on backend start: install missing imports used by the backend files.
