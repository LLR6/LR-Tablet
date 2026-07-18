@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title LR Tablet - Development Server
if not exist "node_modules" call npm install
call npm run dev
pause

