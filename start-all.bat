@echo off
title SRLMS Launcher
echo ========================================================
echo Starting SRLMS Services for Local and Mobile Access
echo ========================================================
start "SRLMS Backend (Port 4000)" cmd /k "cd /d %~dp0server && node src/index.js"
start "SRLMS Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"
echo Both services launched in separate windows!
