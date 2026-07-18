@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title LR Tablet - Build PWA
where node.exe >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed.
    echo Install Node.js LTS from https://nodejs.org/ and run this file again.
    pause
    exit /b 1
)
call npm install
if errorlevel 1 goto :failed
call npm run build
if errorlevel 1 goto :failed
echo.
echo PWA build completed: %CD%\dist
pause
exit /b 0
:failed
echo Build failed. Review the error above.
pause
exit /b 1

