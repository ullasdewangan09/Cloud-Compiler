import io
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from dependencies import get_current_user
from models import User
from schemas import CodeExecution as CodeExecutionRequest
from schemas import ComplexityRequest
from queue_sender import send_to_queue
from redis_config import redis_client
from complexity_analyzer import analyze_complexity
from text_sanitizer import sanitize_code_text
from execution_engine import execute_in_docker, prepare_execution_request
from interactive_sessions import (
    get_interactive_java_session,
    start_interactive_java_session,
    stop_interactive_java_session,
)

router = APIRouter()


def model_to_dict(model):
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


@router.post("/complexity")
async def get_complexity(request: ComplexityRequest):
    sanitized_code = sanitize_code_text(request.code)
    return analyze_complexity(sanitized_code, request.language)

@router.post("/execute")
async def execute_code(
    request: CodeExecutionRequest,
    current_user: User = Depends(get_current_user),
):
    prepared_payload = model_to_dict(request)
    sanitized_code = sanitize_code_text(request.code)
    sanitized_input = sanitize_code_text(request.input)
    prepared_payload["code"] = sanitized_code
    prepared_payload["input"] = sanitized_input

    if request.files:
        prepared_payload["files"] = [
            {
                "filename": file.filename,
                "content": sanitize_code_text(file.content),
            }
            for file in request.files
        ]
    else:
        prepared = prepare_execution_request(prepared_payload)
        prepared_payload["files"] = prepared.files
        prepared_payload["entry_file"] = prepared.entry_file
        prepared_payload["compiler_profile"] = prepared.compiler_profile
    prepared_payload["username"] = current_user.username

    job_id = send_to_queue(prepared_payload)

    return {
        "status": "submitted",
        "job_id": job_id,
        "output": "",
        "stdout": "",
        "stderr": "",
        "error": "",
        "execution_time": None,
        "compile_time_ms": None,
        "execution_time_ms": None,
        "total_time_ms": None,
        "queue_wait_ms": None,
        "artifacts": [],
        "diagnostics": {
            "summary": "",
            "details": [],
            "error_stage": None,
        },
    }


@router.post("/execute/sync")
async def execute_code_sync(
    request: CodeExecutionRequest,
    current_user: User = Depends(get_current_user),
):
    payload = model_to_dict(request)
    payload["code"] = sanitize_code_text(request.code)
    payload["input"] = sanitize_code_text(request.input)
    if request.files:
        payload["files"] = [
            {
                "filename": file.filename,
                "content": sanitize_code_text(file.content),
            }
            for file in request.files
        ]

    result = execute_in_docker(payload)
    result["username"] = current_user.username
    return result


@router.post("/execute/java/interactive")
async def start_java_interactive(
    request: CodeExecutionRequest,
    current_user: User = Depends(get_current_user),
):
    payload = model_to_dict(request)
    payload["code"] = sanitize_code_text(request.code)
    payload["input"] = sanitize_code_text(request.input)
    if request.files:
        payload["files"] = [
            {
                "filename": file.filename,
                "content": sanitize_code_text(file.content),
            }
            for file in request.files
        ]
    payload["username"] = current_user.username

    try:
        return start_interactive_java_session(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/execute/java/interactive/{session_id}")
async def get_java_interactive_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    result = get_interactive_java_session(session_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.delete("/execute/java/interactive/{session_id}")
async def stop_java_interactive_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    result = stop_interactive_java_session(session_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.get("/execute/result/{job_id}")
async def get_execute_result(job_id: str):
    result = redis_client.get(f"job:{job_id}") or redis_client.get(f"result:{job_id}")
    if result is None:
        return {
            "status": "pending",
            "job_id": job_id,
            "output": "",
            "stdout": "",
            "stderr": "",
            "error": "",
            "execution_time": None,
            "compile_time_ms": None,
            "execution_time_ms": None,
            "total_time_ms": None,
            "queue_wait_ms": None,
            "artifacts": [],
            "diagnostics": {
                "summary": "",
                "details": [],
                "error_stage": None,
            },
        }

    try:
        parsed = json.loads(result)  # type: ignore[arg-type]
    except json.JSONDecodeError:
        parsed = {
            "status": "completed",
            "job_id": job_id,
            "output": result,
            "stdout": result,
            "stderr": "",
            "error": "",
            "execution_time": None,
            "compile_time_ms": None,
            "execution_time_ms": None,
            "total_time_ms": None,
            "queue_wait_ms": None,
            "artifacts": [],
            "diagnostics": {
                "summary": "",
                "details": [],
                "error_stage": None,
            },
        }

    parsed.setdefault("job_id", job_id)
    return parsed


@router.post("/import-file")
async def import_file(file: UploadFile = File(...)):

    content = await file.read()
    decoded_content = content.decode("utf-8")

    return {
        "filename": file.filename,
        "code": sanitize_code_text(decoded_content)
    }


@router.post("/export-file")
async def export_file(data: dict):

    filename = data.get("filename", "code.txt")
    code = sanitize_code_text(data.get("code", ""))
    filetype = data.get("type", "code")

    if filetype == "pdf":

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer)
        y = 800

        for line in code.split("\n"):
            pdf.drawString(50, y, line)
            y -= 15

        pdf.save()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.pdf"
            }
        )

    file_stream = io.BytesIO(code.encode())

    return StreamingResponse(
        file_stream,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
