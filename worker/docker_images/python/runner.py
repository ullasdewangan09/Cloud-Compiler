import subprocess

try:
    result = subprocess.run(
        ["python", "code.py"],
        capture_output=True,
        text=True,
        timeout=5
    )

    if result.stdout:
        print(result.stdout)

    if result.stderr:
        print(result.stderr)

except subprocess.TimeoutExpired:
    print("Error: Execution timed out (5 seconds limit)")
