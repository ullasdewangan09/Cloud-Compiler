import hashlib
import bcrypt
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Pre-hash with SHA-256 so bcrypt input stays under the 72-byte limit.
def hash_password(password: str):
    password_bytes = password.encode("utf-8")
    prehashed = hashlib.sha256(password_bytes).digest()
    return bcrypt.hashpw(prehashed, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password, hashed_password):
    hashed_bytes = hashed_password.encode("utf-8")
    plain_bytes = plain_password.encode("utf-8")
    prehashed = hashlib.sha256(plain_bytes).digest()

    try:
        if bcrypt.checkpw(prehashed, hashed_bytes):
            return True
    except ValueError:
        return False

    # Backward compatibility for users hashed before pre-hashing was added.
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except ValueError:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
