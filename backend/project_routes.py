import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Project, User
from schemas import ProjectPayload

router = APIRouter(prefix="/projects", tags=["Projects"])


def model_to_dict(model):
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def serialize_project(project: Project, owner_username: str) -> dict:
    share_url = f"/shared/{project.share_id}" if project.share_id and project.is_public else None
    return {
        "id": project.id,
        "name": project.name,
        "language": project.language,
        "input": project.stdin_text or "",
        "files": json.loads(project.files_json),
        "entry_file": project.entry_file,
        "compiler_profile": project.compiler_profile,
        "compiler_flags": project.compiler_flags or "",
        "is_public": project.is_public,
        "owner_username": owner_username,
        "share_id": project.share_id,
        "share_url": share_url,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("")
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(Project)
        .filter(Project.owner_id == current_user.id)
        .order_by(Project.updated_at.desc())
        .all()
    )
    return [serialize_project(project, current_user.username) for project in projects]


@router.post("/save")
def save_project(
    payload: ProjectPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = Project(
        owner_id=current_user.id,
        name=payload.name,
        language=payload.language,
        entry_file=payload.entry_file,
        stdin_text=payload.input,
        compiler_profile=payload.compiler_profile,
        compiler_flags=payload.compiler_flags,
        files_json=json.dumps([model_to_dict(file) for file in payload.files]),
        is_public=payload.is_public,
        share_id=uuid.uuid4().hex[:12] if payload.is_public else None,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return serialize_project(project, current_user.username)


@router.put("/{project_id}")
def update_project(
    project_id: int,
    payload: ProjectPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.name = payload.name
    project.language = payload.language
    project.entry_file = payload.entry_file
    project.stdin_text = payload.input
    project.compiler_profile = payload.compiler_profile
    project.compiler_flags = payload.compiler_flags
    project.files_json = json.dumps([model_to_dict(file) for file in payload.files])
    project.is_public = payload.is_public
    if project.is_public and not project.share_id:
        project.share_id = uuid.uuid4().hex[:12]
    if not project.is_public:
        project.share_id = None
    db.commit()
    db.refresh(project)
    return serialize_project(project, current_user.username)


@router.post("/{project_id}/share")
def share_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.is_public = True
    if not project.share_id:
        project.share_id = uuid.uuid4().hex[:12]
    db.commit()
    db.refresh(project)
    return serialize_project(project, current_user.username)


@router.get("/shared/{share_id}")
def get_shared_project(share_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.share_id == share_id, Project.is_public.is_(True)).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Shared project not found")

    owner = db.query(User).filter(User.id == project.owner_id).first()
    owner_username = owner.username if owner else "anonymous"
    return serialize_project(project, owner_username)
