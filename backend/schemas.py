from pydantic import BaseModel
from datetime import datetime

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
    code: str
    language: str
    input: str


class ComplexityRequest(BaseModel):
    code: str
    language: str
