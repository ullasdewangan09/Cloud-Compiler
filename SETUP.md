# Cloud Compiler - Setup & Run Guide

## Architecture Overview

The Cloud Compiler consists of three main components:

1. **Frontend** (React + TypeScript) - Web UI for writing and executing code
2. **Backend** (FastAPI) - API server that manages job queues and execution
3. **Worker** (Python) - Executes code in isolated Docker containers

## Prerequisites

- Python 3.10+ (3.13.12 recommended)
- Node.js 18+
- Docker Desktop (running)
- Redis server (running on localhost:6379)

## Installation & Setup

### 1. Backend Setup

```powershell
cd backend
# Install dependencies
pip install -r requirements.txt

# Required services should be running:
# - Redis on localhost:6379
```

### 2. Worker Setup

```powershell
cd worker

# Build Docker images for each language
docker build -t python-runner docker_images/python
docker build -t cpp-runner docker_images/cpp
docker build -t java-runner docker_images/java

# Install worker dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```powershell
cd frontend
npm install
```

## Running the Application

### Terminal 1 - Start Backend (API Server)

```powershell
cd backend
# Activate virtual environment if needed
.venv\Scripts\Activate
uvicorn main:app --reload
```

The backend will be available at: `http://localhost:8000`

### Terminal 2 - Start Worker

```powershell
cd worker
# Activate virtual environment if needed
.venv\Scripts\Activate
python worker.py
```

The worker listens for jobs in the Redis queue and executes them in Docker containers.

### Terminal 3 - Start Frontend

```powershell
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## How It Works

1. **User writes code** in the frontend (Python, C++, or Java)
2. **Clicks "Run Code"** → Frontend sends request to Backend API
3. **Backend receives request** → Creates job ID, adds to Redis queue
4. **Worker picks up job** → Retrieves from Redis queue
5. **Worker executes code** → Runs in Docker container with resource limits
6. **Results stored** → Backend saves output in Redis
7. **Frontend retrieves result** → Displays output to user

## Environment Configuration

Backend and Frontend communicate via:
- **API URL**: `http://localhost:8000` (configurable in `frontend/.env.local`)

CORS is enabled on the backend to allow frontend requests.

## Troubleshooting

### "uvicorn not recognized"
```powershell
# Use full path to python executable
C:\Users\dewan\Programming Projects\Cloud Compiler\.venv\Scripts\uvicorn.exe main:app --reload
```

### Docker image not found
```powershell
# Rebuild images
cd worker
docker build -t python-runner docker_images/python
docker build -t cpp-runner docker_images/cpp
docker build -t java-runner docker_images/java
```

### Redis connection error
- Ensure Redis is running on `localhost:6379`
- Install Redis: `choco install redis-64` (Windows) or use `redis-server`

### Frontend cannot reach backend
- Check backend is running on `http://localhost:8000`
- Verify CORS settings in `backend/main.py`
- Check browser console for errors

## API Endpoints

### POST /execute
Execute code on a worker

**Request:**
```json
{
  "code": "print('Hello')",
  "language": "python"
}
```

**Response:**
```json
{
  "status": "completed",
  "output": "Hello\n",
  "language": "python"
}
```

### GET /
Health check

**Response:**
```json
{
  "status": "Backend Running"
}
```

### GET /history
Get execution history (if implemented)

## Supported Languages

- **Python** - 3.10
- **C++** - C++ 17
- **Java** - OpenJDK 17

## Resource Limits

Each container execution has:
- **Memory Limit**: 256MB
- **CPU Limit**: 0.5 CPU cores (500,000,000 nano CPUs)
- **Timeout**: 5 seconds
- **Network**: Disabled (isolated execution)
