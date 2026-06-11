@echo off
set LOG="C:\Program Files\Soporte360\updater.log"
echo %date% %time% - Updater iniciado >> %LOG%
set /p LOCAL_VERSION=<"C:\Program Files\Soporte360\version.txt"
echo Local: %LOCAL_VERSION% >> %LOG%
curl.exe -s http://100.85.203.15:8080/version.txt -o "%TEMP%\s360_version.txt"
if not exist "%TEMP%\s360_version.txt" goto error
set /p SERVER_VERSION=<"%TEMP%\s360_version.txt"
echo Servidor: %SERVER_VERSION% >> %LOG%
if "%SERVER_VERSION%"=="%LOCAL_VERSION%" goto fin
echo Actualizando... >> %LOG%
net stop Soporte360 >nul 2>&1
taskkill /IM soporte360.exe /F >nul 2>&1
timeout /t 2 >nul
curl.exe -s http://100.85.203.15:8080/soporte360.exe -o "C:\Program Files\Soporte360\soporte360.exe"
curl.exe -s http://100.85.203.15:8080/sciter.dll -o "C:\Program Files\Soporte360\sciter.dll"
copy /Y "%TEMP%\s360_version.txt" "C:\Program Files\Soporte360\version.txt" >nul
echo Actualizado a %SERVER_VERSION% >> %LOG%
start "" "C:\Program Files\Soporte360\soporte360.exe"
goto fin
:error
echo ERROR: No se pudo descargar version.txt >> %LOG%
:fin