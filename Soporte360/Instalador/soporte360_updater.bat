@echo off
set UPDATE_URL=http://100.85.203.15:8080
set /p LOCAL_VERSION=<"C:\Program Files\Soporte360\version.txt"
curl -s %UPDATE_URL%/version.txt -o "%TEMP%\s360_version.txt"
if not exist "%TEMP%\s360_version.txt" exit
set /p SERVER_VERSION=<"%TEMP%\s360_version.txt"
if "%SERVER_VERSION%"=="%LOCAL_VERSION%" exit
net stop Soporte360 >nul 2>&1
taskkill /IM soporte360.exe /F >nul 2>&1
timeout /t 2 >nul
curl -s %UPDATE_URL%/soporte360.exe -o "C:\Program Files\Soporte360\soporte360.exe"
curl -s %UPDATE_URL%/sciter.dll -o "C:\Program Files\Soporte360\sciter.dll"
copy /Y "%TEMP%\s360_version.txt" "C:\Program Files\Soporte360\version.txt" >nul
start "" "C:\Program Files\Soporte360\soporte360.exe"
