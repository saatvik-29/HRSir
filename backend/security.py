import bcrypt

# bcrypt has a 72-byte limit for passwords
MAX_PASSWORD_BYTES = 72

def _truncate_password_bytes(password: str) -> bytes:
    """Truncate password to 72 bytes for bcrypt compatibility, returning bytes."""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        return password_bytes[:MAX_PASSWORD_BYTES]
    return password_bytes

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash, truncating if necessary."""
    try:
        # Truncate password to 72 bytes
        truncated_password_bytes = _truncate_password_bytes(plain_password)
        # Convert hash to bytes if it's a string
        if isinstance(hashed_password, str):
            hash_bytes = hashed_password.encode('utf-8')
        else:
            hash_bytes = hashed_password
        # Verify using bcrypt directly
        return bcrypt.checkpw(truncated_password_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password, truncating if necessary."""
    # Truncate password to 72 bytes
    truncated_password_bytes = _truncate_password_bytes(password)
    # Hash using bcrypt directly
    hashed = bcrypt.hashpw(truncated_password_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode('utf-8')
