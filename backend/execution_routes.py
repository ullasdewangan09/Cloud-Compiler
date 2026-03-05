import io

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from autoscaler.docker_manager import DockerManager
from schemas import CodeExecution as CodeExecutionRequest
from schemas import ComplexityRequest
from queue_sender import send_to_queue
from redis_config import redis_client
from complexity_analyzer import analyze_complexity
from text_sanitizer import sanitize_code_text

router = APIRouter()
docker_manager = DockerManager()


@router.post("/complexity")
async def get_complexity(request: ComplexityRequest):
    sanitized_code = sanitize_code_text(request.code)
    return analyze_complexity(sanitized_code, request.language)

@router.post("/execute")
async def execute_code(request: CodeExecutionRequest):
    sanitized_code = sanitize_code_text(request.code)
    sanitized_input = sanitize_code_text(request.input)

    job_id = send_to_queue({
        "code": sanitized_code,
        "language": request.language,
        "input": sanitized_input
    })

    return {
        "status": "submitted",
        "job_id": job_id,
        "output": "",
        "error": "",
        "execution_time": None
    }


@router.post("/execute/sync")
async def execute_code_sync(request: CodeExecutionRequest):
    sanitized_code = sanitize_code_text(request.code)
    sanitized_input = sanitize_code_text(request.input)

    result = docker_manager.run_container(
        request.language,
        sanitized_code,
        sanitized_input
    )

    return {
        "status": result["status"],
        "output": result["output"],
        "error": result["error"],
        "execution_time": result["execution_time"]
    }


@router.get("/execute/result/{job_id}")
async def get_execute_result(job_id: str):

    result = redis_client.get(f"result:{job_id}")

    if result is None:
        return {
            "status": "pending",
            "job_id": job_id,
            "output": "",
            "error": "",
            "execution_time": None
        }

    return {
        "status": "completed",
        "job_id": job_id,
        "output": result,
        "error": "",
        "execution_time": None
    }


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
