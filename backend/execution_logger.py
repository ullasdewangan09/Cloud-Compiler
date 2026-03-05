execution_logs = []

def log_execution(user, language, status):
    execution_logs.append({
        "user": user,
        "language": language,
        "status": status
    })

def get_execution_logs():
    # Return up to the last 50 records without raising on short lists.
    return execution_logs[-50:]
