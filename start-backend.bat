@echo off
title SRLMS Backend Server
cd /d "%~dp0server"
node src/index.js
pause
