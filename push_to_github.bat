@echo off
title Push E-GYM to GitHub
cd /d "%~dp0"

echo ===================================================
echo   Pushing E-GYM to https://github.com/cypxer-sudo/e-gym.git
echo ===================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo ===================================================
) else (
    echo ===================================================
    echo   [FAILED] Git push encountered an error.
    echo ===================================================
)
echo.
pause
