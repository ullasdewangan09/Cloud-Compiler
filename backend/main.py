from contextlib import asynccontextmanager
import threading

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from autoscaler.autoscaler import autoscaler_loop
from auth_routes import router as auth_router
from database import engine
from dependencies import require_admin
from execution_routes import router as execution_router
from interactive_sessions import shutdown_interactive_sessions
from metrics_routes import router as metrics_router
from models import Base
from project_routes import router as project_router
from visualization_routes import router as visualization_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start autoscaler when app starts.
    thread = threading.Thread(target=autoscaler_loop, daemon=True)
    thread.start()
    try:
        yield
    finally:
        shutdown_interactive_sessions()


app = FastAPI(lifespan=lifespan)

# ✅ CORS Middleware (VERY IMPORTANT for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create database tables
Base.metadata.create_all(bind=engine)

# ✅ Include routers
app.include_router(auth_router)
app.include_router(execution_router)
app.include_router(project_router)

@app.get("/")
def root():
    return {"message": "Cloud Compiler Studio Running"}

# ✅ Admin-only route
@app.get("/admin/stats")
def admin_stats(admin=Depends(require_admin)):
    return {"message": "Admin only endpoint"}
app.include_router(metrics_router)
app.include_router(visualization_router)
