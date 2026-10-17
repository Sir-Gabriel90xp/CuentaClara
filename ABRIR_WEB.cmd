@echo off
cd /d "%~dp0"
python scripts\serve-preview.py
if errorlevel 1 pause
