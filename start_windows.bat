@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
set PORT=4173
:findport
netstat -ano | findstr /R /C:":!PORT! .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT+=1
  if !PORT! GTR 4199 (
    echo No se encontro un puerto libre entre 4173 y 4199.
    pause
    exit /b 1
  )
  goto findport
)
set URL=http://127.0.0.1:!PORT!/?fresh=%RANDOM%
echo Configurador SWARCO beta
echo Servidor local: %URL%
start "" "%URL%"
py scripts\beta_server.py !PORT!
if errorlevel 1 python scripts\beta_server.py !PORT!
