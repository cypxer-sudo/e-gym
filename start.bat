@echo off
title E-GYM Web App Launcher
cd /d "%~dp0"

echo ========================================================
echo   Starting E-GYM: The Self-Development Platform
echo   "BECOME UNREAL. TRAIN EVERY DIMENSION."
echo ========================================================

REM 1. Check if python is in PATH
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    python server.py
    goto end
)

REM 2. Check local AppData Python 3.14 installation
if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" server.py
    goto end
)

REM 3. Fallback: Directly open index.html in the default browser
echo Python not found in standard paths. Launching standalone web app...
start index.html

:end
