@echo off
title BETTERTRADES
cd /d "%~dp0"
echo Starting BETTERTRADES...
echo Keep this window open while testing.
echo Close this window when you are finished.
echo.
call npm run desktop
pause
