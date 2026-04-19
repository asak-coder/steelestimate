from pathlib import Path

s = Path(".env.example").read_text(encoding="utf-8")
for line in s.splitlines():
    if "MONGODB_URI" in line or "mongodb+srv://" in line or "MONGO" in line:
        print(line)
