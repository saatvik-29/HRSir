@echo off
REM Start Qdrant using Docker Compose

echo Starting Qdrant vector database...
docker-compose -f docker-compose.qdrant.yml up -d

echo Waiting for Qdrant to be ready...
timeout /t 3 /nobreak > nul

REM Check if Qdrant is running
curl -s http://localhost:6333/ > nul 2>&1
if %errorlevel% equ 0 (
    echo Qdrant is running!
    echo Dashboard: http://localhost:6333/dashboard
    echo API: http://localhost:6333
) else (
    echo Qdrant failed to start. Check logs with:
    echo    docker-compose -f docker-compose.qdrant.yml logs
)

pause
