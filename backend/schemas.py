from pydantic import BaseModel, Field
from datetime import datetime


class CodeFile(BaseModel):
    filename: str
    content: str = ""


class ExecutionTelemetry(BaseModel):
    submitted_at: datetime | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    queue_wait_ms: float | None = None
    compile_time_ms: float | None = None
    execution_time_ms: float | None = None
    total_time_ms: float | None = None


class ExecutionDiagnostics(BaseModel):
    summary: str = ""
    details: list[str] = Field(default_factory=list)
    error_stage: str | None = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class CodeExecution(BaseModel):
    code: str = ""
    language: str
    input: str = ""
    files: list[CodeFile] | None = None
    entry_file: str | None = None
    compiler_profile: str | None = None
    compiler_flags: str = ""


class ComplexityRequest(BaseModel):
    code: str
    language: str


class ProjectPayload(BaseModel):
    name: str
    language: str
    input: str = ""
    files: list[CodeFile]
    entry_file: str
    compiler_profile: str | None = None
    compiler_flags: str = ""
    is_public: bool = False


class ProjectResponse(ProjectPayload):
    id: int
    owner_username: str
    share_id: str | None = None
    share_url: str | None = None
    created_at: datetime
    updated_at: datetime
