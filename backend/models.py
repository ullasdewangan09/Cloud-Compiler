from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    language = Column(String, nullable=False)
    entry_file = Column(String, nullable=False)
    stdin_text = Column(Text, default="")
    compiler_profile = Column(String, nullable=True)
    compiler_flags = Column(Text, default="")
    files_json = Column(Text, nullable=False)
    share_id = Column(String, unique=True, index=True, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
