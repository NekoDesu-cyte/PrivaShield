@echo off
set "PYTHONPATH=%PYTHONPATH%;%CD%\backend"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
